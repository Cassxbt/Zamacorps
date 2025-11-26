/**
 * 3D UI Animation Utilities
 * Beautiful, smooth animations for a premium feel
 */

export const animations = {
    // Float animation for cards
    float: {
        y: [0, -10, 0],
        transition: {
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut",
        },
    },

    // Fade in from bottom with 3D transform
    fadeInUp: {
        initial: { opacity: 0, y: 20, rotateX: 10 },
        animate: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut" as const,
            },
        },
    },

    // Card hover effect with 3D depth
    cardHover: {
        scale: 1.05,
        y: -10,
        rotateX: 5,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 20,
        },
    },

    // Stagger children animation
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    },

    // Pulse animation for buttons
    pulse: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse" as const,
        },
    },
};

/**
 * CSS class utilities for 3D effects
 */
export const css3D = {
    // Glassmorphism effect
    glass: "backdrop-blur-xl bg-white/10 border border-white/20",

    // 3D card with depth
    card3D: "transform-gpu transition-all duration-300 hover:shadow-2xl hover:-translate-y-2",

    // Neumorphism shadow
    neumorph: "shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]",

    // Gradient text
    gradientText: "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent",

    // 3D button
    button3D: "relative transform-gpu transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl",
};

/**
 * Gradient backgrounds
 */
export const gradients = {
    aurora: "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500",
    ocean: "bg-gradient-to-br from-blue-500 via-teal-500 to-green-500",
    sunset: "bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500",
    midnight: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    neon: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500",
};
