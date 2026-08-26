# Notification parser fixtures

These examples are anonymized regression fixtures. They are deliberately representative rather than copied from a user’s private messages. Provider wording and package names should be updated from approved, redacted samples during QA.

| Provider | Example notification | Expected type | Amount | Expected account |
|---|---|---:|---:|---|
| MTN MoMo | `MTN MoMo: You have received GHS 250.00 from Ama. Ref: MM12345` | credit | 250.00 | MTN MoMo |
| MTN MoMo | `MoMo payment of GH₵ 42.50 to Shoprite. Transaction ID: TX77881` | debit | 42.50 | MTN MoMo |
| Telecel Cash | `Telecel Cash: You received GHS 100 from Kojo. Ref 991122` | credit | 100.00 | Telecel Cash |
| Telecel Cash | `You sent GH₵ 18.00 to ECG for bill payment. Ref: VC88221` | debit | 18.00 | Telecel Cash |

The parser should reject notifications with no supported provider marker, no recognized incoming/outgoing verb, or no positive amount. A detected alert should remain pending until the user confirms its category and account when the parser cannot determine them confidently.
