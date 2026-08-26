# Android notification importer

PocketLedger can optionally read newly posted Android notifications from enabled financial apps. The feature is implemented locally by `PocketLedgerNotificationService`, exposed to JavaScript through `PocketLedgerNotifications`, and parsed by `TransactionParser`.

## User flow

The user opens **Settings → Automatic detection → Money notifications**, then enables PocketLedger under Android’s notification-access settings. PocketLedger does not request the normal SMS inbox permission. The service listens for new notifications, ignores messages without a supported provider and monetary transaction verb, deduplicates by provider/type/amount/reference/time bucket, and stores detected records in a local pending queue.

The JavaScript API is in `src/services/notificationImporter.ts`:

```ts
const enabled = await notificationImporter.isEnabled();
const pending = await notificationImporter.getPending();
const subscription = notificationImporter.subscribe(item => {
  // Show a review item; do not silently post unless the user enabled auto-save.
});
```

The recommended product behavior is to show every detected item in a review queue. The caller should convert an approved item with `toTransactionInput()` and dispatch `addTransactionAsync()`.

## Provider matching and regex strategy

The parser combines the notification title and body, normalizes whitespace, identifies MTN MoMo from package-name or text markers such as `mtn momo`, `momo`, and `mobile money`, and identifies Telecel Cash from package-name or text markers such as `telecel cash`, `telecel`, and `vodafone cash`.

The amount pattern accepts `GHS`, `GH₵`, `GH c`, `₵`, or `ZMW` prefixes and comma-formatted decimal amounts. The parser recognizes incoming verbs such as `received`, `credited`, `credit alert`, `you got`, and `deposit`, and outgoing verbs such as `sent`, `paid`, `payment`, `purchase`, `withdraw`, `debited`, `debit alert`, `airtime`, and `bill`. References are extracted from `ref`, `reference`, `transaction id`, `transaction no`, and `transaction number` labels. A counterparty is extracted after `from`, `to`, `at`, `merchant`, `recipient`, `sent to`, or `received from` when the alert exposes one.

These expressions are intentionally conservative but cannot guarantee correctness against provider changes. Provider fixtures should be maintained from anonymized real alerts, and a parser update should be released whenever wording or notification packages change.

## Privacy and limitations

Only new posted notifications are observed after access is enabled. Android does not provide a general historical notification inbox to this service. Raw text is currently retained in the local pending queue to support user review; production hardening should minimize retention, provide a clear delete action, and avoid sending raw notification text to any server. The feature is Android-only. iOS applications cannot read other apps’ notifications or Messages inbox.
