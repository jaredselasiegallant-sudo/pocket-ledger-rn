package com.pocketledger

import java.util.Locale
import java.util.regex.Pattern

data class ParsedTransaction(
  val provider: String,
  val type: String,
  val amount: Double,
  val currency: String,
  val title: String,
  val vendor: String?,
  val reference: String?,
  val account: String?,
  val transactionDate: Long,
  val sourcePackage: String,
  val rawText: String
)

object TransactionParser {
  private val amountPattern = Pattern.compile("(?:GHS|GH₵|GH\\s?c|₵|ZMW)?\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE)
  private val referencePattern = Pattern.compile("(?:ref(?:erence)?|transaction\\s*(?:id|no|number))\\s*[:#-]?\\s*([A-Z0-9-]{5,})", Pattern.CASE_INSENSITIVE)
  private val counterpartyPattern = Pattern.compile("(?:from|to|at|merchant|recipient|sent to|received from)\\s+([A-Za-z][A-Za-z .'-]{2,40})", Pattern.CASE_INSENSITIVE)

  fun parse(sourcePackage: String, title: String?, body: String?, postedAt: Long): ParsedTransaction? {
    val combined = listOf(title.orEmpty(), body.orEmpty()).joinToString(" ").replace(Regex("\\s+"), " ").trim()
    if (combined.isBlank()) return null
    val lower = combined.lowercase(Locale.US)
    val provider = providerFor(sourcePackage, lower) ?: return null
    val type = when {
      containsAny(lower, "received", "credited", "credit alert", "you got", "deposit") -> "credit"
      containsAny(lower, "sent", "paid", "payment", "purchase", "withdraw", "debited", "debit alert", "airtime", "bill") -> "debit"
      else -> return null
    }
    val amount = amountPattern.matcher(combined).let { m ->
      var found: Double? = null
      while (m.find()) {
        val candidate = m.group(1).replace(",", "").toDoubleOrNull()
        if (candidate != null && candidate > 0) { found = candidate; break }
      }
      found
    } ?: return null
    val reference = referencePattern.matcher(combined).let { if (it.find()) it.group(1) else null }
    val vendor = counterpartyPattern.matcher(combined).let { if (it.find()) it.group(1).trim().trimEnd('.', ',') else null }
    val account = when (provider) { "MTN MoMo" -> "MTN MoMo"; "Telecel Cash" -> "Telecel Cash"; else -> null }
    return ParsedTransaction(provider, type, amount, "GHS", title?.takeIf { it.isNotBlank() } ?: provider, vendor, reference, account, postedAt, sourcePackage, combined)
  }

  private fun providerFor(pkg: String, text: String): String? = when {
    pkg.contains("mtn", true) || containsAny(text, "mtn momo", "momo", "mobile money") -> "MTN MoMo"
    pkg.contains("telecel", true) || pkg.contains("vodafone", true) || containsAny(text, "telecel cash", "vodafone cash", "telecel") -> "Telecel Cash"
    else -> null
  }

  private fun containsAny(value: String, vararg needles: String) = needles.any { value.contains(it) }
}
