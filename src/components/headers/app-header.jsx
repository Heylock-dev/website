"use client";

import { useEffect, Fragment } from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "../ui/sidebar";
import { useHeaderStore } from "@/stores/headerStore";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/all";
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeSwitcher } from "../ui/shadcn-io/theme-switcher";
import NotificationsButton from "../buttons/notifications-button";

export default function AppHeader() {
    const centeredText = useHeaderStore((state) => state.centeredText);

    useEffect(() => {
        changeText(centeredText);
    }, [centeredText]);

    async function changeText(text) {
        gsap.registerPlugin(ScrambleTextPlugin);

        gsap.to('#gsap-text', {
            duration: 0.4,
            scrambleText: {
                text: centeredText,
                chars: '01$&',
                speed: 4
            }
        });
    }

    return (
        <header className="h-12 px-6 flex items-center border-b border-border">
            <SidebarTrigger className="-ml-1 mr-4" />

            <BreadcrumbWithCustomSeparator />

            {
                centeredText === null && <h2 className="flex-1 text-foreground text-center" id="gsap-text">{centeredText}</h2>
            }

            <div className="gap-4 flex">
              <NotificationsButton />
              <ThemeSwitcher />
            </div>
        </header>
    );
}

const ALLOWED_PATHS = {
  '/dashboard': 'Dashboard',
  '/dashboard/chat': 'Chat',
  '/dashboard/sessions': 'Sessions',
  '/dashboard/sessions/*': 'Session details',
  '/dashboard/settings': 'Settings',
  '/sign-in': 'Sign In',
  '/sign-up': 'Sign Up',
  '/confirm-email': 'Confirm Email',
};

// List of exact paths or prefix patterns where the breadcrumb should NOT be shown at all.
// - Use exact paths like '/'
// - Use prefix patterns with a trailing '/*' like '/auth/*' to hide on any subpath
const HIDDEN_PATHS = ['/', '/dashboard/', '/dashboard/chat'];

function BreadcrumbWithCustomSeparator() {
  const pathname = usePathname();
  
  // Helper that checks if the current pathname matches any hidden rule.
  const isPathHidden = (path) => {
    if (!path) return false;
    return HIDDEN_PATHS.some((rule) => {
      if (rule.endsWith('/*')) {
        // prefix match
        const prefix = rule.slice(0, -1); // keep the trailing '/'
        return path.startsWith(prefix);
      }
      return path === rule;
    });
  };

  // If pathname matches a hidden rule, don't render the breadcrumb at all
  if (isPathHidden(pathname)) return null;
  
  // Escape a string so it can be used in a RegExp
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Return the configured label for a path by checking ALLOWED_PATHS keys.
  // Supports three kinds of patterns:
  // - Exact match (e.g. '/dashboard')
  // - Wildcard/glob using '*' (e.g. '/dashboard/sessions/*')
  // - Explicit regex using the 'regex:' prefix (e.g. 'regex:^/dashboard/\\w+/details$')
  const getLabelForPath = (path) => {
    for (const pattern of Object.keys(ALLOWED_PATHS)) {
      const label = ALLOWED_PATHS[pattern];

      if (pattern.startsWith('regex:')) {
        try {
          const re = new RegExp(pattern.slice(6));
          if (re.test(path)) return label;
        } catch (e) {
          // invalid regex — skip
          continue;
        }
      } else if (pattern.includes('*')) {
        // convert simple glob to regex (escape other chars, replace '*' with '.*')
        const regexText = '^' + pattern.split('*').map(escapeRegExp).join('.*') + '$';
        const re = new RegExp(regexText);
        if (re.test(path)) return label;
      } else {
        if (pattern === path) return label;
      }
    }

    return null;
  };

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    let currentPath = '';

    // Start with an empty breadcrumb list — we intentionally do NOT include Home ('/') here
    const breadcrumbs = [];

    for (const path of paths) {
      currentPath += `/${path}`;
      const label = getLabelForPath(currentPath);
      if (label) {
        breadcrumbs.push({ href: currentPath, label });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // If no allowed breadcrumb segments found, don't show the breadcrumb
  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          index < breadcrumbs.length - 1 ? (
            <Fragment key={breadcrumb.href}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="ml-1" />
            </Fragment>
          ) : (
            <BreadcrumbItem key={breadcrumb.href}>
              <BreadcrumbLink asChild>
                <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          )
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
