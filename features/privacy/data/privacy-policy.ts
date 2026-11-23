// MVP placeholder: replace this copy and the contact details after legal/privacy review.
export const privacyPolicy = {
  title: "Privacy Policy",
  status: "Draft policy — pending VERIS privacy review",
  updatedLabel: "Last updated: To be confirmed",
  introduction:
    "This draft explains how VERIS handles personal data submitted through the Helpdesk. It supports the consent requested on the Submit Ticket form and is not a substitute for VERIS's approved privacy policy.",
  sections: [
    {
      heading: "Information we collect",
      body: "When you submit a ticket, we collect your name, email address, user type, selected service, ticket subject and description, priority, and any file you choose to attach. Attachments may contain personal information, so only include files that are relevant to your support request.",
    },
    {
      heading: "Why we use this information",
      body: "We use the information to receive, investigate, respond to, and keep a record of your support request; communicate with you about the ticket; and maintain the security and reliability of the Helpdesk.",
    },
    {
      heading: "Who can access it",
      body: "Access is limited to authorized VERIS helpdesk personnel and service providers that operate the Helpdesk, including its database, file storage, and email services, when access is needed to provide support or operate the service.",
    },
    {
      heading: "How we protect attachments",
      body: "Attachments are restricted to JPG, PNG, and PDF files up to 10 MB. They are stored in a private storage area and are available only to authorized users handling the related ticket.",
    },
    {
      heading: "Retention and your choices",
      body: "VERIS will retain ticket information only for the period approved in its final retention policy. The process for requesting access, correction, or deletion of your personal data will be added when this policy is approved.",
    },
  ],
  contact: {
    label: "Privacy contact details are being confirmed.",
    actionLabel: "Return to Submit Ticket",
    href: "/submit-ticket",
  },
} as const;
