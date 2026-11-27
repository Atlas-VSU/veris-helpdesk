/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadTs } = require("./helpers/load-ts.cjs");

const navigationModule = loadTs("features/shared/navigationItems.ts");

function createLinkMock() {
  return function MockLink({ href, children, ...props }) {
    return React.createElement("a", { href, ...props }, children);
  };
}

function createAvatarMocks() {
  return {
    Avatar: ({ children, ...props }) => React.createElement("span", props, children),
    AvatarImage: (props) => React.createElement("img", props),
    AvatarFallback: ({ children, ...props }) => React.createElement("span", props, children),
  };
}

function createDrawerMocks() {
  return {
    Drawer: ({ children }) => React.createElement("div", { "data-slot": "drawer" }, children),
    DrawerTrigger: ({ children, ...props }) => React.createElement("button", props, children),
    DrawerContent: ({ children, ...props }) => React.createElement("div", props, children),
    DrawerHeader: ({ children, ...props }) => React.createElement("div", props, children),
    DrawerTitle: ({ children, ...props }) => React.createElement("div", props, children),
  };
}

function renderDesktopNav(pathname) {
  const { default: DesktopNavigation } = loadTs(
    "features/shared/components/DesktopNavigation.tsx",
    {
      "next/link": createLinkMock(),
      "next/navigation": { usePathname: () => pathname },
      "@/components/ui/avatar": createAvatarMocks(),
      "../navigationItems": navigationModule,
    },
  );
  return renderToStaticMarkup(React.createElement(DesktopNavigation));
}

function renderMobileDrawer(pathname) {
  const { default: MobileDrawer } = loadTs(
    "features/shared/components/MobileDrawer.tsx",
    {
      "next/link": createLinkMock(),
      "next/navigation": { usePathname: () => pathname },
      "@/components/ui/avatar": createAvatarMocks(),
      "@/components/ui/drawer": createDrawerMocks(),
      "../navigationItems": navigationModule,
    },
  );
  return renderToStaticMarkup(React.createElement(MobileDrawer));
}

function renderFooter() {
  const { Footer } = loadTs("features/shared/components/Footer.tsx", {
    "next/link": createLinkMock(),
  });
  return renderToStaticMarkup(React.createElement(Footer));
}

test("DesktopNavigation removes Admin Login and promotes Submit Ticket as primary CTA", () => {
  const html = renderDesktopNav("/");

  assert.doesNotMatch(html, /\/admin\/login/);
  assert.doesNotMatch(html, /Admin Login/i);

  assert.match(html, /href="\/"[^>]*aria-current="page"[^>]*>Home<\/a>/);
  assert.match(html, /href="\/verify"[^>]*>My Tickets<\/a>/);
  assert.match(html, /href="\/faq"[^>]*>FAQ<\/a>/);
  assert.match(html, /href="\/submit-ticket"[^>]*>[\s\S]*Submit Ticket<\/a>/);
});

test("DesktopNavigation marks My Tickets, FAQ, and Submit Ticket active on their respective routes", () => {
  const verifyHtml = renderDesktopNav("/verify");
  assert.match(verifyHtml, /href="\/verify"[^>]*aria-current="page"[^>]*>My Tickets<\/a>/);

  const ticketsHtml = renderDesktopNav("/tickets/VRS-001");
  assert.match(ticketsHtml, /href="\/verify"[^>]*aria-current="page"[^>]*>My Tickets<\/a>/);

  const faqHtml = renderDesktopNav("/faq");
  assert.match(faqHtml, /href="\/faq"[^>]*aria-current="page"[^>]*>FAQ<\/a>/);

  const submitHtml = renderDesktopNav("/submit-ticket");
  assert.match(submitHtml, /href="\/submit-ticket"[^>]*aria-current="page"[^>]*>[\s\S]*Submit Ticket<\/a>/);
});

test("MobileDrawer omits Admin Login and renders client navigation with Submit Ticket CTA", () => {
  const html = renderMobileDrawer("/faq");

  assert.doesNotMatch(html, /\/admin\/login/);
  assert.doesNotMatch(html, /Admin Login/i);

  assert.match(html, /href="\/"[^>]*>[\s\S]*Home<\/a>/);
  assert.match(html, /href="\/verify"[^>]*>[\s\S]*My Tickets<\/a>/);
  assert.match(html, /href="\/faq"[^>]*aria-current="page"[^>]*>[\s\S]*FAQ<\/a>/);
  assert.match(html, /href="\/submit-ticket"[^>]*>[\s\S]*Submit Ticket<\/a>/);
});

test("Footer keeps subtle Admin Portal entry alongside client utility links", () => {
  const html = renderFooter();

  assert.match(html, /aria-label="Footer navigation"/);
  assert.match(html, /href="\/privacy"[^>]*>Privacy &amp; Policy<\/a>/);
  assert.match(html, /href="\/faq"[^>]*>FAQ<\/a>/);
  assert.match(html, /href="\/admin\/login"[^>]*>Admin Portal<\/a>/);
});
