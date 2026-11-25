"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/section-heading";

const FAQS = [
  {
    question: "Do I need a JioSaavn account?",
    answer:
      "No. dhun talks to the same public endpoints the JioSaavn web player uses, so there's nothing to sign up for — no phone number, no OTP, no Jio SIM required.",
  },
  {
    question: "What quality are the downloads?",
    answer:
      "dhun fetches the highest stream JioSaavn serves for a track — up to 320 kbps AAC (.m4a), with cover art and metadata embedded. The files play everywhere: VLC, foobar2000, Apple Music, Poweramp, your car stereo.",
  },
  {
    question: "Is this legal?",
    answer:
      "dhun is a personal-use tool. Downloading copyright-protected music without a licence may be illegal where you live — check your local rules, and support artists by streaming officially or buying their work.",
  },
  {
    question: "Where do files get saved?",
    answer:
      "In ~/Music/dhun by default. Change it with dhun config set music-dir <path>, or pass -o to any command. Filenames follow the {title} — {artists}.m4a pattern and are safe for every filesystem.",
  },
  {
    question: "Does it work on Windows?",
    answer:
      "Yes — Windows 10+, macOS 12+ (Intel and Apple silicon) and Linux. dhun is a pure Python package installed with a single pip command, so the experience is identical everywhere. You just need Python 3.9 or newer.",
  },
  {
    question: "Is dhun affiliated with JioSaavn?",
    answer:
      "No. dhun is an independent, MIT-licensed community project. JioSaavn is a trademark of Jio Platforms Ltd. — this tool is not endorsed by or connected to them.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="// faq"
          title="Questions, answered"
          description="The things everyone asks before they hit enter."
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.question} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium hover:text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
