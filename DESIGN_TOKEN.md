# Help Desk Design Tokens

Status: proposed project specification · Theme: light

Color source: `C:\Projects\veris-page\DESIGN_TOKENS.md` (VERIS Website).

This specification adapts the reference's moss green, terracotta, warm cream, and olive palette for a help-desk website. All solid colors come from the supplied reference. Help-desk semantic mappings, spacing, component sizing, and interaction rules are proposed additions. These tokens are ready to implement; this document does not imply that application styles have already been changed.

## 1. Design direction

Build a calm, readable support interface for finding answers, submitting requests, and managing tickets. Use cream for the page, warm white for content surfaces, moss green for primary actions, and terracotta for attention. Keep ticket lists compact and consistent; reserve decorative organic shapes for optional welcome illustrations.

## 2. Reference palette

These values preserve the supplied palette exactly. Use the semantic tokens below in components instead of repeating hex values.

| Primitive token | Value | Reference role |
| --- | --- | --- |
| `--palette-cream` | `#FDFCF8` | Page background |
| `--palette-warm-white` | `#FEFEFA` | Cards and popovers |
| `--palette-charcoal-olive` | `#2C2C24` | Main text |
| `--palette-moss` | `#5D7052` | Primary and success |
| `--palette-off-white` | `#F3F4F1` | Text on moss |
| `--palette-terracotta` | `#C18C5D` | Secondary and warning |
| `--palette-white` | `#FFFFFF` | Reference secondary text |
| `--palette-clay` | `#E6DCCD` | Accent surface |
| `--palette-dark-olive` | `#4A4A40` | Accent text |
| `--palette-sand` | `#F0EBE5` | Muted surface |
| `--palette-gray-olive` | `#78786C` | Reference muted text |
| `--palette-stone` | `#DED8CF` | Dividers and input borders |
| `--palette-coral` | `#A85448` | Errors and destructive actions |

## 3. Semantic colors

| Token | Value | Help-desk use |
| --- | --- | --- |
| `--background` | `#FDFCF8` | Application canvas |
| `--foreground` | `#2C2C24` | Body text and headings |
| `--card` | `#FEFEFA` | Articles, ticket details, forms |
| `--card-foreground` | `#2C2C24` | Text on cards |
| `--popover` | `#FEFEFA` | Menus and dialogs |
| `--popover-foreground` | `#2C2C24` | Menu and dialog text |
| `--primary` | `#5D7052` | Submit ticket, send reply, active actions |
| `--primary-foreground` | `#F3F4F1` | Text on primary actions |
| `--secondary` | `#C18C5D` | Secondary emphasis |
| `--secondary-foreground` | `#2C2C24` | Text on terracotta; adapted from reference white |
| `--accent` | `#E6DCCD` | Selection and hover surface |
| `--accent-foreground` | `#4A4A40` | Text on accent |
| `--muted` | `#F0EBE5` | Toolbar and subdued panel surface |
| `--muted-foreground` | `#4A4A40` | Metadata, hints, timestamps; adapted from reference gray-olive |
| `--border` | `#DED8CF` | Decorative separators and card outlines |
| `--input` | `#78786C` | Input boundaries; stronger than reference stone |
| `--ring` | `#5D7052` | Keyboard focus |
| `--destructive` | `#A85448` | Delete action and error emphasis |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive actions |
| `--success` | `#5D7052` | Resolution and successful submission |
| `--success-foreground` | `#F3F4F1` | Text on solid success surface |
| `--success-muted` | `#F0EBE5` | Success message background |
| `--warning` | `#C18C5D` | Pending requests and attention |
| `--warning-foreground` | `#2C2C24` | Text on warning surface |
| `--warning-muted` | `#F0EBE5` | Warning message background |
| `--link` | `#5D7052` | Underlined links on cream or warm white |

The source palette is unchanged; three semantic assignments are adapted for interface readability: secondary/warning text uses charcoal olive, muted text uses dark olive, and input borders use gray-olive.

### Readability checks

Calculated contrast ratios for opaque color pairs, rounded to two decimals:

| Pair | Contrast ratio |
| --- | --- |
| Off-white text on moss | 4.87:1 |
| Charcoal olive text on terracotta | 4.81:1 |
| Dark olive text on sand | 7.56:1 |
| White text on coral | 5.22:1 |

The reference's white on terracotta is 2.93:1, and its gray-olive on sand is 3.77:1. Avoid those pairs for small interface text. These calculations cover the listed colors only; assess actual components, overlays, and interaction states during implementation. Statuses must include visible labels and, where useful, distinct icons rather than relying on color alone.

## 4. Ticket status and priority

Status describes workflow; priority describes urgency. Show each separately.

| Status | Background token | Text token | Suggested icon |
| --- | --- | --- | --- |
| Open | `--accent` | `--foreground` | Inbox |
| In progress | `--primary` | `--primary-foreground` | Activity |
| Awaiting reply | `--warning` | `--warning-foreground` | Clock |
| Resolved | `--success` | `--success-foreground` | Check circle |
| Closed | `--muted` | `--muted-foreground` | Archive |

| Priority | Background token | Text token |
| --- | --- | --- |
| Low | `--muted` | `--muted-foreground` |
| Normal | `--accent` | `--accent-foreground` |
| High | `--warning` | `--warning-foreground` |
| Urgent | `--destructive` | `--destructive-foreground` |

Use small labeled badges. Reserve coral for urgent priority, validation errors, and destructive actions. Success/warning banners use a muted background, dark body text, and a labeled state indicator.

## 5. Typography

Retain Nunito for the interface and Fraunces for optional welcome headings. Use a true monospace fallback for ticket IDs and code snippets; the source's `--font-mono` alias to Nunito is intentionally not carried over.

| Token | Value | Use |
| --- | --- | --- |
| `--font-sans` | `"Nunito", system-ui, sans-serif` | Interface and articles |
| `--font-serif` | `"Fraunces", Georgia, serif` | Optional welcome heading |
| `--font-mono` | `ui-monospace, Consolas, monospace` | Ticket IDs and code |
| `--text-xs` | `0.75rem` | Short badges only |
| `--text-sm` | `0.875rem` | Metadata, table cells, labels |
| `--text-base` | `1rem` | Body, inputs, replies |
| `--text-lg` | `1.125rem` | Card titles |
| `--text-xl` | `1.5rem` | Section headings |
| `--text-2xl` | `2rem` | Page headings |
| `--text-3xl` | `2.5rem` | Help-center welcome heading |
| `--weight-regular` | `400` | Body |
| `--weight-semibold` | `600` | Labels and buttons |
| `--weight-bold` | `700` | Headings and selected navigation |
| `--leading-tight` | `1.2` | Headings |
| `--leading-normal` | `1.5` | Interface text |
| `--leading-reading` | `1.65` | Knowledge-base articles |

Load the chosen fonts in the application; declaring a font family does not load its files. Keep text left aligned, use sentence case, and show ticket IDs with tabular numerals where supported.

## 6. Spacing and layout

Spacing follows a 4px base at a 16px root font size.

| Token | Value | Typical use |
| --- | --- | --- |
| `--space-1` | `0.25rem` | Icon-to-label micro spacing |
| `--space-2` | `0.5rem` | Badge padding and tight gaps |
| `--space-3` | `0.75rem` | Control horizontal padding |
| `--space-4` | `1rem` | Mobile gutters and form gaps |
| `--space-5` | `1.25rem` | Compact panel padding |
| `--space-6` | `1.5rem` | Desktop panel padding |
| `--space-8` | `2rem` | Section gaps |
| `--space-10` | `2.5rem` | Large group spacing |
| `--space-12` | `3rem` | Page section spacing |
| `--space-16` | `4rem` | Welcome section spacing |
| `--layout-max` | `80rem` | Main content width |
| `--article-max` | `70ch` | Article reading width |
| `--sidebar-width` | `16rem` | Desktop navigation |
| `--header-height` | `4rem` | Minimum header height |
| `--control-height` | `2.75rem` | Minimum button/input height |
| `--ticket-row-height` | `3.5rem` | Minimum ticket row height |

Use a single column below 48rem. From 48rem, allow supporting panels when content fits. From 64rem, show persistent sidebar navigation. Use 1rem page gutters on small screens and 2rem on larger screens. Rows and controls must grow when text wraps. On small screens, present essential ticket fields in stacked rows and put remaining details inside the ticket view.

## 7. Radius, borders, shadows, and layers

Retain the reference's 24px base radius for large surfaces. Add smaller radii for practical controls and dense ticket layouts.

| Token | Value | Use |
| --- | --- | --- |
| `--radius-control` | `0.5rem` | Inputs and buttons |
| `--radius-panel` | `0.75rem` | Ticket panels and menus |
| `--radius` | `1.5rem` | Reference base radius |
| `--radius-sm` | `calc(var(--radius) - 4px)` | 20px at default root |
| `--radius-md` | `calc(var(--radius) - 2px)` | 22px at default root |
| `--radius-lg` | `var(--radius)` | 24px; knowledge-base cards |
| `--radius-xl` | `calc(var(--radius) + 4px)` | 28px; welcome panels |
| `--radius-full` | `9999px` | Badges and avatars |
| `--border-width` | `1px` | Default outlines |
| `--focus-width` | `2px` | Focus outline |
| `--focus-offset` | `3px` | Space outside focused control |
| `--shadow-soft` | `0 4px 20px -2px rgba(93, 112, 82, 0.15)` | Reference card shadow |
| `--shadow-float` | `0 10px 40px -10px rgba(193, 140, 93, 0.2)` | Reference popover shadow |
| `--z-sticky` | `10` | Sticky header |
| `--z-dropdown` | `20` | Dropdown menus |
| `--z-overlay` | `30` | Modal backdrop |
| `--z-modal` | `40` | Dialog |
| `--z-toast` | `50` | Notifications |

Prefer borders over shadows in ticket tables. Use a cream focus outline on solid moss surfaces so focus remains visible. Keep focus outlines clear of clipping containers. Layer values assume a shared stacking context.

## 8. Motion and interaction

| Token | Value | Use |
| --- | --- | --- |
| `--duration-fast` | `120ms` | Hover and pressed feedback |
| `--duration-normal` | `180ms` | Menus and tooltips |
| `--duration-slow` | `300ms` | Dialog and page entry |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Interface transitions |

Use brief opacity transitions and small movements of up to 6px. Keep ticket content stable during updates. Suppress decorative motion when `prefers-reduced-motion: reduce` is active; preserve essential progress feedback as text. Avoid continuous floating or rotating decoration in the ticket workspace.

## 9. Component recipes

| Component | Tokens and behavior |
| --- | --- |
| Primary button | Primary background + primary foreground; control radius; minimum control height. On hover, add a 1px foreground inset outline; on press, use a 2px inset outline. |
| Secondary button | Card background + foreground text + input border. On hover, use accent background. Use terracotta fills only for deliberate emphasis. |
| Destructive button | Destructive background + destructive foreground; name the action clearly. |
| Search/input | Card background + foreground text + input border; muted foreground placeholder; visible label; ring on keyboard focus. |
| Input error | Destructive border plus descriptive error text below the field. Preserve the entered value. |
| Sidebar | Muted background; dark olive text. Selected item uses accent background, bold text, and a moss indicator. |
| Ticket list | Card background; border dividers; muted hover; accent selection with a labeled selection control. |
| Article card | Card background; foreground title; muted foreground description; large radius; optional soft shadow. |
| Conversation | Card background; bordered reply groups; readable body text; explicit author and timestamp. |
| Internal note | Accent background + accent foreground with an “Internal note” label. |
| Dialog | Popover colors; panel radius; float shadow; backdrop `rgba(44, 44, 36, 0.35)`. |
| Disabled control | Muted background + muted foreground; expose disabled state; avoid reducing the opacity of surrounding text. |
| Loading/empty state | Plain explanatory text and a next action when available; preserve layout while loading. |

## 10. Copy-ready CSS custom properties

Framework-neutral foundation. Additional status aliases below keep ticket components consistent.

```css
:root {
  /* Exact reference palette */
  --palette-cream: #FDFCF8;
  --palette-warm-white: #FEFEFA;
  --palette-charcoal-olive: #2C2C24;
  --palette-moss: #5D7052;
  --palette-off-white: #F3F4F1;
  --palette-terracotta: #C18C5D;
  --palette-white: #FFFFFF;
  --palette-clay: #E6DCCD;
  --palette-dark-olive: #4A4A40;
  --palette-sand: #F0EBE5;
  --palette-gray-olive: #78786C;
  --palette-stone: #DED8CF;
  --palette-coral: #A85448;

  /* Help-desk semantic mappings */
  --background: var(--palette-cream);
  --foreground: var(--palette-charcoal-olive);
  --card: var(--palette-warm-white);
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
  --primary: var(--palette-moss);
  --primary-foreground: var(--palette-off-white);
  --secondary: var(--palette-terracotta);
  --secondary-foreground: var(--foreground);
  --accent: var(--palette-clay);
  --accent-foreground: var(--palette-dark-olive);
  --muted: var(--palette-sand);
  --muted-foreground: var(--palette-dark-olive);
  --border: var(--palette-stone);
  --input: var(--palette-gray-olive);
  --ring: var(--primary);
  --destructive: var(--palette-coral);
  --destructive-foreground: var(--palette-white);
  --success: var(--primary);
  --success-foreground: var(--primary-foreground);
  --success-muted: var(--muted);
  --warning: var(--secondary);
  --warning-foreground: var(--foreground);
  --warning-muted: var(--muted);
  --link: var(--primary);

  --status-open: var(--accent);
  --status-open-foreground: var(--foreground);
  --status-in-progress: var(--primary);
  --status-in-progress-foreground: var(--primary-foreground);
  --status-awaiting-reply: var(--warning);
  --status-awaiting-reply-foreground: var(--warning-foreground);
  --status-resolved: var(--success);
  --status-resolved-foreground: var(--success-foreground);
  --status-closed: var(--muted);
  --status-closed-foreground: var(--muted-foreground);
  --priority-low: var(--muted);
  --priority-low-foreground: var(--muted-foreground);
  --priority-normal: var(--accent);
  --priority-normal-foreground: var(--accent-foreground);
  --priority-high: var(--warning);
  --priority-high-foreground: var(--warning-foreground);
  --priority-urgent: var(--destructive);
  --priority-urgent-foreground: var(--destructive-foreground);

  --font-sans: "Nunito", system-ui, sans-serif;
  --font-serif: "Fraunces", Georgia, serif;
  --font-mono: ui-monospace, Consolas, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 2.5rem;
  --weight-regular: 400;
  --weight-semibold: 600;
  --weight-bold: 700;
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-reading: 1.65;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --layout-max: 80rem;
  --article-max: 70ch;
  --sidebar-width: 16rem;
  --header-height: 4rem;
  --control-height: 2.75rem;
  --ticket-row-height: 3.5rem;

  --radius-control: 0.5rem;
  --radius-panel: 0.75rem;
  --radius: 1.5rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-full: 9999px;
  --border-width: 1px;
  --focus-width: 2px;
  --focus-offset: 3px;
  --shadow-soft: 0 4px 20px -2px rgba(93, 112, 82, 0.15);
  --shadow-float: 0 10px 40px -10px rgba(193, 140, 93, 0.2);
  --overlay: rgba(44, 44, 36, 0.35);
  --z-sticky: 10;
  --z-dropdown: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-toast: 50;
  --duration-fast: 120ms;
  --duration-normal: 180ms;
  --duration-slow: 300ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

Use semantic aliases throughout the application. Keep any future dark theme in a separate token override and review its color pairs independently before enabling it.
