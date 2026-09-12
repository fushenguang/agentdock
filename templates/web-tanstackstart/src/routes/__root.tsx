import { Button } from "@astryxdesign/core/Button";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { Link, Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "{{PROJECT_NAME}}" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      ...(import.meta.env.DEV ? [{ rel: "stylesheet", href: "/virtual:stylex.css" }] : []),
    ],
  }),
});

function RootComponent() {
  return (
    <RootDocument>
      <Theme theme={neutralTheme}>
        <LinkProvider component={Link}>
          <Outlet />
        </LinkProvider>
      </Theme>
    </RootDocument>
  );
}

function NotFound() {
  return (
    <main style={{ padding: 32 }}>
      <h1>404</h1>
      <p>The requested page does not exist.</p>
      <Button label="Back home" variant="primary" href="/" />
    </main>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
