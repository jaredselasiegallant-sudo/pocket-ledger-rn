package com.pocketledger

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.content.Context
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class PocketLedgerNotificationService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification) {
    val extras = sbn.notification.extras
    val title = extras.getCharSequence("android.title")?.toString()
    val body = (extras.getCharSequence("android.bigText") ?: extras.getCharSequence("android.text"))?.toString()
    val parsed = TransactionParser.parse(sbn.packageName, title, body, sbn.postTime) ?: return
    val fingerprint = listOf(parsed.provider, parsed.type, parsed.amount, parsed.reference ?: "", parsed.transactionDate / 60000).joinToString("|")
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val seen = prefs.getStringSet(SEEN, emptySet())?.toMutableSet() ?: mutableSetOf()
    if (!seen.add(fingerprint)) return
    while (seen.size > 500) seen.remove(seen.first())
    val queue = JSONArray(prefs.getString(QUEUE, "[]"))
    queue.put(JSONObject().apply {
      put("id", fingerprint); put("provider", parsed.provider); put("type", parsed.type); put("amount", parsed.amount); put("currency", parsed.currency)
      put("title", parsed.title); put("vendor", parsed.vendor); put("reference", parsed.reference); put("account", parsed.account)
      put("transactionDate", parsed.transactionDate); put("sourcePackage", parsed.sourcePackage); put("rawText", parsed.rawText)
    })
    prefs.edit().putString(QUEUE, queue.toString()).putStringSet(SEEN, seen).apply()
    bridge?.let { context ->
      val map = Arguments.createMap().apply { putString("id", fingerprint); putString("provider", parsed.provider); putString("type", parsed.type); putDouble("amount", parsed.amount); putString("currency", parsed.currency); putString("title", parsed.title); putString("vendor", parsed.vendor); putString("reference", parsed.reference); putString("account", parsed.account); putDouble("transactionDate", parsed.transactionDate.toDouble()); putString("sourcePackage", parsed.sourcePackage); putString("rawText", parsed.rawText) }
      context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(EVENT, map)
    }
  }
  companion object {
    const val EVENT = "PocketLedgerNotificationReceived"
    private const val PREFS = "pocket_ledger_notifications"
    private const val QUEUE = "pending"
    private const val SEEN = "seen"
    @Volatile private var bridge: ReactApplicationContext? = null
    fun attach(context: ReactApplicationContext) { bridge = context }
    fun detach() { bridge = null }
    fun isEnabled(context: Context): Boolean { val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners").orEmpty(); return enabled.split(':').any { it.startsWith(context.packageName + "/") } }
  }
}
