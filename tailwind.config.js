tailwind.config = {
	darkMode: "media",
	theme: {
		extend: {
			backdropBlur: {
				xs: "2px"
			},
			animation: {
				"fade-in": "fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
				"slide-up": "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
				"scale-in": "scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
			},
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0", transform: "translateY(20px)" },
					"100%": { opacity: "1", transform: "translateY(0)" }
				},
				slideUp: {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" }
				},
				scaleIn: {
					"0%": { opacity: "0", transform: "scale(0.95)" },
					"100%": { opacity: "1", transform: "scale(1)" }
				}
			}
		}
	}
};
