import {
  ArrowRight,
  LucideBook,
  LucideHeart,
  LucideNotebook,
  LucidePen,
  LucideStar,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { useState } from "react";

const confetti = [
  { shape: "📖", delay: 0, x: -30, y: -50 },
  { shape: "🪙", delay: 0.1, x: 30, y: -40 },
  { shape: "✨", delay: 0.05, x: 0, y: -60 },
  { shape: "✏️", delay: 0.15, x: -15, y: -35 },
];
export function StartLearningButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence>
        {isHovered &&
          confetti.map((element, index) => (
            <motion.div
              key={index}
              className="absolute text-2xl pointer-events-none"
              initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
              animate={{
                scale: [0, 1],
                x: element.x,
                y: element.y,
                opacity: [0, 1],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                delay: element.delay,
                duration: 0.3,
                type: "spring",
                stiffness: 150,
              }}
              style={{
                left: "50%",
                top: "0%",
                transform: "translateX(-50%)",
              }}
            >
              {element.shape}
            </motion.div>
          ))}
      </AnimatePresence>

      <Link href="/courses" className="relative">
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="btn-primary inline-flex items-center justify-center"
        >
          <motion.span animate={{ x: isHovered ? -5 : 0 }}>
            Start Learning
          </motion.span>
          <motion.span animate={{ rotate: isHovered ? "-90deg" : "0deg", y: isHovered? 5 : 0 }}>
            <ArrowRight className="w-5 h-5 ml-2" />
          </motion.span>
        </motion.div>
      </Link>
    </div>
  );
}
