import {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
} from "@remix-run/react";
import { ArrowRightLeft, Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import stylesheet from "~/tailwind.css?url";
import { getToast } from "remix-toast";
import { useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { Toaster } from "~/components/ui/toaster";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const meta: MetaFunction = () => {
  return [
    { title: "Google Translate OpenAI" },
    { name: "Google Translate OpenAI", content: "Google Translate OpenAI" },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { toast, headers } = await getToast(request);
  return json({ toast }, { headers });
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { toast: loaderToast } = useLoaderData<typeof loader>();
  const { toast } = useToast();

  useEffect(() => {
    if (loaderToast) {
      toast({
        variant: "default",
        title: "Error",
        description: loaderToast.message,
      });
    }
  }, [loaderToast]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <ArrowRightLeft className="h-6 w-6" />
            <span className="sr-only">Acme Inc</span>
          </Link>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <ArrowRightLeft className="h-6 w-6" />
                <span className="sr-only">Acme Inc</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Groq Llama3 Translate</h1>
          <p>
            Please use small text it&apos;s just a demo with a free tier groq
            service
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
