"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { FooterLamps } from "@/components/DiwaliDecor";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative mt-20 border-t border-white/10 bg-cream-dark"
    >
      <FooterLamps />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Logo className="text-[24px]" />
          <p className="mt-3 text-sm text-foreground/60">
            Timeless Indian traditional wear, handcrafted with care.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Shop</h4>
          <ul className="flex flex-col gap-2 text-sm text-foreground/70">
            <li>
              <Link className="sutra-underline hover:text-primary" href="/shop?category=women">
                Women
              </Link>
            </li>
            <li>
              <Link className="sutra-underline hover:text-primary" href="/shop?category=men">
                Men
              </Link>
            </li>
            <li>
              <Link className="sutra-underline hover:text-primary" href="/shop">
                All Products
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="flex flex-col gap-2 text-sm text-foreground/70">
            <li>
              <Link className="sutra-underline hover:text-primary" href="/our-story">
                Our Story
              </Link>
            </li>
            <li>
              <Link className="sutra-underline hover:text-primary" href="/account">
                My Account
              </Link>
            </li>
            <li>
              <Link className="sutra-underline hover:text-primary" href="/checkout">
                Checkout
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="flex flex-col gap-2 text-sm text-foreground/70">
            <li>hello@sutra.in</li>
            <li>+91 98765 43210</li>
          </ul>
        </div>
      </div>

      {/* The year is the build's on the server and today's in the browser; they
          differ from 1 Jan until the next deploy, and that's expected. */}
      <div suppressHydrationWarning className="border-t border-white/10 py-4 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} Sutra. All rights reserved.
      </div>
    </motion.footer>
  );
}
