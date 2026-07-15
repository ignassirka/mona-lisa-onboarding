/** Copy for the simulated web-checkout browser window (Chrome-style chrome +
 * the embedded "Review subscription and pay" page + its success state). No
 * i18n framework exists in this codebase (see docs), so — matching every
 * other content file here (`toneOfVoice.tsx`, `jtbdUpsell.ts`) — every string
 * is centralized in this one exported object rather than inlined in JSX. */
export const CHECKOUT_COPY = {
  browser: {
    tabTitle: "Proton VPN — Review subscription",
    /** Simulated, clearly-fake account URL — decorative prototype chrome, not a real address bar. */
    url: "account.proton.me/vpn/checkout",
  },
  page: {
    heading: "Review subscription and pay",
    subscriptionOptionsHeading: "Subscription options",
    paymentDetailsHeading: "Payment details",
    cardDetailsHeading: "Card details",
    cardNumberPlaceholder: "Card number",
    cardExpiryPlaceholder: "MM/YY",
    cardCvcPlaceholder: "CVC",
    billingCountryLabel: "Billing Country:",
    threeDSecureNote: "We use 3-D Secure to protect your payments",
    backButton: "Back",
    paymentMethods: {
      card: "Credit/debit card",
      paypal: "PayPal",
      bitcoin: "Bitcoin",
      googlePay: "Google Pay",
    },
  },
  summary: {
    heading: "Summary",
    currency: "USD",
    planName: "VPN Plus",
    usersLabel: "1 user",
    totalLabelPrefix: "Total for",
    creditsLabel: "Credits",
    amountDueLabel: "Amount due",
    payButtonPrefix: "Pay",
    payButtonSuffix: "now",
    processingLabel: "Processing…",
    taxNotePrefix: "Including",
    taxNoteMiddle: "tax:",
    giftCodeLabel: "Add a gift code",
    trustTls: "Payments are protected with TLS encryption and Swiss privacy laws.",
    trustGuarantee: "30-day money-back guarantee.",
    termsLinkText: "terms and conditions",
    whatDoIGet: "What do I get?",
    whatDoIGetItems: [
      "Servers in 60+ countries",
      "Up to 10 devices at once",
      "NetShield ad & malware blocking",
      "Priority support",
    ],
  },
  success: {
    heading: "Payment successful",
    returnLine: "You're all set — return to the Proton VPN app to continue.",
  },
  returnHint: "Click on the VPN app window to continue",
} as const;
