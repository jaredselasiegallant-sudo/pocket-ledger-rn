package com.pocketledger

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONArray

class PocketLedgerNotificationModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "PocketLedgerNotifications"
  override fun initialize() { super.initialize(); PocketLedgerNotificationService.attach(context) }
  override fun onCatalystInstanceDestroy() { PocketLedgerNotificationService.detach(); super.onCatalystInstanceDestroy() }

  @ReactMethod fun isNotificationAccessEnabled(promise: Promise) {
    val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners").orEmpty()
    promise.resolve(enabled.split(':').any { it.startsWith(context.packageName + "/") })
  }
  @ReactMethod fun openNotificationAccessSettings() {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }
  @ReactMethod fun getPendingTransactions(promise: Promise) {
    try {
      val raw = context.getSharedPreferences("pocket_ledger_notifications", 0).getString("pending", "[]") ?: "[]"
      val array = JSONArray(raw); val result = Arguments.createArray()
      for (i in 0 until array.length()) {
        val item = array.getJSONObject(i); val map = Arguments.createMap()
        item.keys().forEach { key -> when (val value = item.get(key)) { is Number -> map.putDouble(key, value.toDouble()); is Boolean -> map.putBoolean(key, value); JSONObject.NULL -> map.putNull(key); else -> map.putString(key, value.toString()) } }
        result.pushMap(map)
      }
      promise.resolve(result)
    } catch (e: Exception) { promise.reject("PENDING_READ_FAILED", e) }
  }
  @ReactMethod fun clearPendingTransactions() {
    context.getSharedPreferences("pocket_ledger_notifications", 0).edit().putString("pending", "[]").apply()
  }
  @ReactMethod fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {}
  @ReactMethod fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {}
}
