// Default configuration
const defaultConfig = {
	location: { lat: 59.9386, lon: 30.3141 }, // Saint Petersburg coordinates
	sections: [
		{
			id: "work",
			name: "Work",
			icon: "briefcase",
			items: [
				{
					name: "Gmail",
					url: "https://mail.google.com",
					icon: "envelope",
					color: "#ea4335"
				},
				{
					name: "GitHub",
					url: "https://github.com",
					icon: "github-logo",
					color: "#333333"
				},
				{
					name: "Claude",
					url: "https://claude.ai",
					icon: "robot",
					color: "#ff6b35"
				},
				{
					name: "Calendar",
					url: "https://calendar.google.com",
					icon: "calendar",
					color: "#4285f4"
				},
				{
					name: "Drive",
					url: "https://drive.google.com",
					icon: "google-drive-logo",
					color: "#0f9d58"
				}
			]
		},
		{
			id: "entertainment",
			name: "Entertainment",
			icon: "play",
			items: [
				{
					name: "YouTube",
					url: "https://youtube.com",
					icon: "youtube-logo",
					color: "#ff0000"
				},
				{
					name: "X",
					url: "https://x.com",
					icon: "x",
					color: "#000000"
				},
				{
					name: "Reddit",
					url: "https://reddit.com",
					icon: "reddit-logo",
					color: "#ff4500"
				},
				{
					name: "Steam",
					url: "https://store.steampowered.com",
					icon: "game-controller",
					color: "#171a21"
				}
			]
		},
		{
			id: "dev",
			name: "Development",
			icon: "code",
			items: [
				{
					name: "Stack Overflow",
					url: "https://stackoverflow.com",
					icon: "stack-overflow-logo",
					color: "#f48024"
				},
				{
					name: "MDN",
					url: "https://developer.mozilla.org",
					icon: "file-code",
					color: "#005a9c"
				},
				{
					name: "CodePen",
					url: "https://codepen.io",
					icon: "codepen-logo",
					color: "#000000"
				}
			]
		}
	],
	searchEngines: {
		"!g": "https://google.com/search?q=",
		"!y": "https://youtube.com/results?search_query=",
		"!r": "https://reddit.com/search?q=",
		"!x": "https://x.com/search?q=",
		"!cl": "https://claude.ai/new?q=",
		"!ch": "https://chat.openai.com/?q=",
		"!gh": "https://github.com/search?q=",
		"!so": "https://stackoverflow.com/search?q=",
		"!w": "https://en.wikipedia.org/wiki/",
		"!d": "https://duckduckgo.com/?q="
	}
};

// Configuration management
class ConfigManager {
	constructor() {
		this.config = this.loadConfig();
	}

	loadConfig() {
		try {
			const saved = localStorage.getItem("startpage-config");
			return saved
				? { ...defaultConfig, ...JSON.parse(saved) }
				: defaultConfig;
		} catch (e) {
			console.warn(
				"Failed to load config from localStorage, using defaults"
			);
			return defaultConfig;
		}
	}

	saveConfig() {
		try {
			localStorage.setItem(
				"startpage-config",
				JSON.stringify(this.config)
			);
		} catch (e) {
			console.warn("Failed to save config to localStorage");
		}
	}

	getConfig() {
		return this.config;
	}

	updateConfig(newConfig) {
		this.config = { ...this.config, ...newConfig };
		this.saveConfig();
	}
}

// Weather service
class WeatherService {
	constructor(configManager) {
		this.configManager = configManager;
		this.updateWeather();
		setInterval(() => this.updateWeather(), 600000); // Update every 10 minutes
	}

	async updateLocation(latitude, longitude) {
		this.configManager.updateConfig({
			location: { lat: latitude, lon: longitude }
		});
		this.updateWeather();
	}

	async updateWeather() {
		try {
			const { lat, lon } = this.configManager.getConfig().location;
			const response = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`
			);
			const data = await response.json();

			if (data.current_weather) {
				const temp = Math.round(data.current_weather.temperature);
				const windSpeed = Math.round(data.current_weather.windspeed);
				const weatherCode = data.current_weather.weathercode;

				const weatherIcon = this.getWeatherIcon(weatherCode);
				const weatherElement = document.getElementById("weather-info");
				weatherElement.innerHTML = `<i class="${weatherIcon}"></i><span>${temp}°C</span>`;
			}
		} catch (error) {
			console.error("Failed to fetch weather:", error);
			document.getElementById("weather-info").innerHTML =
				'<i class="ph ph-cloud"></i><span>--°</span>';
		}
	}

	getWeatherIcon(code) {
		const iconMap = {
			0: "ph ph-sun", // Clear sky
			1: "ph ph-sun", // Mainly clear
			2: "ph ph-cloud-sun", // Partly cloudy
			3: "ph ph-cloud", // Overcast
			45: "ph ph-cloud", // Fog
			48: "ph ph-cloud", // Depositing rime fog
			51: "ph ph-cloud-rain", // Drizzle: Light
			53: "ph ph-cloud-rain", // Drizzle: Moderate
			55: "ph ph-cloud-rain", // Drizzle: Dense
			61: "ph ph-cloud-rain", // Rain: Slight
			63: "ph ph-cloud-rain", // Rain: Moderate
			65: "ph ph-cloud-rain", // Rain: Heavy
			71: "ph ph-cloud-snow", // Snow fall: Slight
			73: "ph ph-cloud-snow", // Snow fall: Moderate
			75: "ph ph-cloud-snow", // Snow fall: Heavy
			95: "ph ph-cloud-lightning" // Thunderstorm
		};
		return iconMap[code] || "ph ph-cloud";
	}
}

// Search functionality
class SearchManager {
	constructor(configManager) {
		this.configManager = configManager;
		this.searchInput = document.getElementById("search-input");
		this.suggestions = document.getElementById("search-suggestions");
		this.selectedSuggestion = -1;
		this.setupEventListeners();
	}

	setupEventListeners() {
		this.searchInput.addEventListener("input", (e) => {
			this.handleInput(e.target.value);
		});

		this.searchInput.addEventListener("keydown", (e) => {
			this.handleKeydown(e);
		});

		this.searchInput.addEventListener("blur", () => {
			setTimeout(() => this.hideSuggestions(), 150);
		});
	}

	handleInput(value) {
		if (value.length > 0) {
			this.showSuggestions(value);
		} else {
			this.hideSuggestions();
		}
	}

	handleKeydown(e) {
		const suggestions = this.suggestions.querySelectorAll(".suggestion");

		switch (e.key) {
			case "Enter":
				e.preventDefault();
				if (
					this.selectedSuggestion >= 0 &&
					suggestions[this.selectedSuggestion]
				) {
					this.selectSuggestion(suggestions[this.selectedSuggestion]);
				} else {
					this.performSearch(this.searchInput.value);
				}
				break;
			case "ArrowDown":
				e.preventDefault();
				this.selectedSuggestion = Math.min(
					this.selectedSuggestion + 1,
					suggestions.length - 1
				);
				this.updateSuggestionSelection();
				break;
			case "ArrowUp":
				e.preventDefault();
				this.selectedSuggestion = Math.max(
					this.selectedSuggestion - 1,
					-1
				);
				this.updateSuggestionSelection();
				break;
			case "Escape":
				this.searchInput.value = "";
				this.hideSuggestions();
				this.searchInput.blur();
				break;
		}
	}

	showSuggestions(query) {
		const engines = this.configManager.getConfig().searchEngines;
		const suggestions = [];

		// Add search engine suggestions
		Object.keys(engines).forEach((key) => {
			if (
				key.toLowerCase().includes(query.toLowerCase()) ||
				query.startsWith(key)
			) {
				suggestions.push({
					type: "engine",
					key: key,
					name: this.getEngineName(key),
					icon: this.getEngineIcon(key)
				});
			}
		});

		// Add quick suggestions
		if (query.length > 1) {
			suggestions.push({
				type: "search",
				query: query,
				name: `Search for "${query}"`,
				icon: "ph ph-magnifying-glass"
			});
		}

		this.renderSuggestions(suggestions);
	}

	renderSuggestions(suggestions) {
		if (suggestions.length === 0) {
			this.hideSuggestions();
			return;
		}

		this.suggestions.innerHTML = suggestions
			.map(
				(suggestion, index) => `
        <div class="suggestion px-5 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5" data-index="${index}" data-type="${
					suggestion.type
				}" data-query="${suggestion.query || suggestion.key}">
            <i class="${suggestion.icon}"></i>
            <span>${suggestion.name}</span>
        </div>
    `
			)
			.join("");

		this.suggestions.style.display = "block";
		this.selectedSuggestion = -1;

		// Add click listeners
		this.suggestions.querySelectorAll(".suggestion").forEach((el) => {
			el.addEventListener("click", () => this.selectSuggestion(el));
		});
	}

	updateSuggestionSelection() {
		const suggestions = this.suggestions.querySelectorAll(".suggestion");
		suggestions.forEach((el, index) => {
			if (index === this.selectedSuggestion) {
				el.className =
					"suggestion selected bg-blue-500 text-white px-5 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3";
				el.querySelector("i").style.color = "white";
			} else {
				el.className =
					"suggestion px-5 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5";
				el.querySelector("i").style.color = "";
			}
		});
	}

	selectSuggestion(element) {
		const type = element.dataset.type;
		const query = element.dataset.query;

		if (type === "engine") {
			this.searchInput.value = query + " ";
			this.searchInput.focus();
			this.hideSuggestions();
		} else {
			this.performSearch(query);
		}
	}

	performSearch(query) {
		const engines = this.configManager.getConfig().searchEngines;
		const trimmedQuery = query.trim();

		// Check for bang commands
		const bangMatch = trimmedQuery.match(/^(![\w]+)\s*(.*)/);
		if (bangMatch) {
			const [, bang, searchTerm] = bangMatch;
			const engineUrl = engines[bang];

			if (engineUrl) {
				if (searchTerm) {
					window.open(
						engineUrl + encodeURIComponent(searchTerm),
						"_blank"
					);
				} else {
					window.open(engineUrl, "_blank");
				}
			} else {
				// Fallback to DuckDuckGo
				window.open(
					`https://duckduckgo.com/?q=${encodeURIComponent(
						trimmedQuery
					)}`,
					"_blank"
				);
			}
		} else {
			// Regular search with DuckDuckGo
			window.open(
				`https://duckduckgo.com/?q=${encodeURIComponent(trimmedQuery)}`,
				"_blank"
			);
		}

		this.searchInput.value = "";
		this.hideSuggestions();
		this.searchInput.blur();
	}

	hideSuggestions() {
		this.suggestions.style.display = "none";
		this.selectedSuggestion = -1;
	}

	getEngineName(key) {
		const names = {
			"!g": "Google",
			"!y": "YouTube",
			"!r": "Reddit",
			"!x": "X (Twitter)",
			"!cl": "Claude AI",
			"!ch": "ChatGPT",
			"!gh": "GitHub",
			"!so": "Stack Overflow",
			"!w": "Wikipedia",
			"!d": "DuckDuckGo"
		};
		return names[key] || key;
	}

	getEngineIcon(key) {
		const icons = {
			"!g": "ph ph-google-logo",
			"!y": "ph ph-youtube-logo",
			"!r": "ph ph-reddit-logo",
			"!x": "ph ph-x-logo",
			"!cl": "ph ph-robot",
			"!ch": "ph ph-chat-circle",
			"!gh": "ph ph-github-logo",
			"!so": "ph ph-stack-overflow-logo",
			"!w": "ph ph-book-open",
			"!d": "ph ph-magnifying-glass"
		};
		return icons[key] || "ph ph-magnifying-glass";
	}
}

// Tab and content management
class TabManager {
	constructor(configManager) {
		this.configManager = configManager;
		this.currentTab = 0;
		this.setupTabs();
	}

	setupTabs() {
		const config = this.configManager.getConfig();
		const tabsContainer = document.getElementById("tabs-container");
		const contentContainer = document.getElementById("content-container");

		// Create tabs
		tabsContainer.innerHTML = config.sections
			.map(
				(section, index) => `
        <button class="px-5 py-3 rounded-2xl cursor-pointer transition-all duration-300 bg-transparent border-none text-gray-600 dark:text-gray-400 text-sm font-medium whitespace-nowrap flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white ${
			index === 0
				? "bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white shadow-lg -translate-y-0.5"
				: ""
		}" data-tab="${index}">
            <i class="ph ph-${section.icon}"></i>
            <span>${section.name}</span>
        </button>
    `
			)
			.join("");

		// Create content
		contentContainer.innerHTML = config.sections
			.map(
				(section, index) => `
        <div class="animate-fade-in ${
			index === 0 ? "block" : "hidden"
		}" data-content="${index}">
            <div class="grid grid-cols-1 gap-6">
                <div class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 border border-black/10 dark:border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <h2 class="text-xl font-bold mb-5 text-gray-900 dark:text-white flex items-center gap-3">
                        <i class="ph ph-${section.icon}"></i>
                        ${section.name}
                    </h2>
                    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        ${section.items
							.map(
								(item) => `
                            <a href="${item.url}" target="_blank" class="flex flex-col items-center text-gray-900 dark:text-white p-4 rounded-2xl transition-all duration-300 bg-black/5 dark:bg-white/5 border border-transparent hover:bg-white/80 dark:hover:bg-gray-800/80 hover:-translate-y-0.5 hover:scale-105 hover:border-black/10 dark:hover:border-white/10 hover:shadow-lg no-underline">
                                <i class="ph ph-${item.icon} text-3xl mb-2 transition-transform duration-300 hover:scale-110" style="color: ${item.color}"></i>
                                <span class="text-xs font-medium text-center leading-tight">${item.name}</span>
                            </a>
                        `
							)
							.join("")}
                    </div>
                </div>
            </div>
        </div>
    `
			)
			.join("");

		// Add tab click listeners
		tabsContainer.addEventListener("click", (e) => {
			const tab = e.target.closest("button[data-tab]");
			if (tab) {
				this.switchTab(parseInt(tab.dataset.tab));
			}
		});
	}

	switchTab(index) {
		const tabs = document.querySelectorAll("[data-tab]");
		const contents = document.querySelectorAll("[data-content]");

		tabs.forEach((tab, i) => {
			if (i === index) {
				tab.className = tab.className.replace(
					/bg-transparent|bg-white\/90|dark:bg-gray-800\/90|text-gray-600|dark:text-gray-400|text-gray-900|dark:text-white|shadow-lg|-translate-y-0\.5/g,
					""
				);
				tab.className +=
					" bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white shadow-lg -translate-y-0.5";
			} else {
				tab.className = tab.className.replace(
					/bg-white\/90|dark:bg-gray-800\/90|text-gray-900|dark:text-white|shadow-lg|-translate-y-0\.5/g,
					""
				);
				tab.className +=
					" bg-transparent text-gray-600 dark:text-gray-400";
			}
		});

		contents.forEach((content, i) => {
			if (i === index) {
				content.classList.remove("hidden");
				content.classList.add("block");
			} else {
				content.classList.add("hidden");
				content.classList.remove("block");
			}
		});

		this.currentTab = index;
	}

	switchToTab(direction) {
		const config = this.configManager.getConfig();
		const newTab =
			(this.currentTab + direction + config.sections.length) %
			config.sections.length;
		this.switchTab(newTab);
	}

	switchToTabNumber(number) {
		const config = this.configManager.getConfig();
		if (number >= 1 && number <= config.sections.length) {
			this.switchTab(number - 1);
		}
	}
}

// Vim-like keyboard navigation
class VimNavigation {
	constructor(searchManager, tabManager) {
		this.searchManager = searchManager;
		this.tabManager = tabManager;
		this.helpVisible = false;
		this.setupKeyboardListeners();
	}

	setupKeyboardListeners() {
		document.addEventListener("keydown", (e) => {
			// Don't interfere when typing in search
			if (document.activeElement === this.searchManager.searchInput) {
				return;
			}

			switch (e.key) {
				case "/":
					e.preventDefault();
					this.searchManager.searchInput.focus();
					break;
				case "?":
					e.preventDefault();
					this.toggleHelp();
					break;
				case "j":
					e.preventDefault();
					this.tabManager.switchToTab(1);
					break;
				case "k":
					e.preventDefault();
					this.tabManager.switchToTab(-1);
					break;
				case "Escape":
					this.hideHelp();
					break;
				default:
					// Number keys 1-9 for direct tab switching
					const num = parseInt(e.key);
					if (num >= 1 && num <= 9) {
						e.preventDefault();
						this.tabManager.switchToTabNumber(num);
					}
					break;
			}
		});
	}

	toggleHelp() {
		this.helpVisible = !this.helpVisible;
		const helpElement = document.getElementById("vim-help");
		helpElement.classList.toggle("show", this.helpVisible);
	}

	hideHelp() {
		this.helpVisible = false;
		document.getElementById("vim-help").classList.remove("show");
	}
}

// Time display
class TimeDisplay {
	constructor() {
		this.updateTime();
		setInterval(() => this.updateTime(), 1000);
	}

	updateTime() {
		const now = new Date();
		const timeString = now.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit"
		});
		document.getElementById("current-time").textContent = timeString;
	}
}

// Settings management functions
function openSettings() {
	document.getElementById("settings-dialog").showModal();
	renderSectionsList();
}

function closeSettings() {
	document.getElementById("settings-dialog").close();
}

function changeGradient(number) {
	const body = document.getElementById("body-element");
	body.className = body.className.replace(
		/gradient-\d+/,
		`gradient-${number}`
	);

	// Save to config
	const configManager = window.configManager;
	const config = configManager.getConfig();
	config.selectedGradient = number;
	configManager.saveConfig();
}

function renderSectionsList() {
    const config = window.configManager.getConfig();
    const container = document.getElementById('sections-list');
    
    container.innerHTML = config.sections.map((section, index) => `
        <div class="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 flex-wrap gap-2">
            <div class="flex items-center gap-3 flex-wrap">
                <i class="ph ph-${section.icon} text-xl text-gray-900 dark:text-white"></i>
                <span class="font-medium text-gray-900 dark:text-white">${section.name}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">${section.items.length} items</span>
            </div>
            <div class="flex gap-2">
                <button onclick="editSection(${index})" class="px-3 py-1 w-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shadow-sm">
                    <i class="ph ph-pencil"></i>
                </button>
                <button onclick="moveSection(${index}, -1)" class="px-3 py-1 w-full bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" ${index === 0 ? 'disabled' : ''}>
                    <i class="ph ph-arrow-up"></i>
                </button>
                <button onclick="moveSection(${index}, 1)" class="px-3 py-1 w-full bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" ${index === config.sections.length - 1 ? 'disabled' : ''}>
                    <i class="ph ph-arrow-down"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function moveSection(index, direction) {
	const config = window.configManager.getConfig();
	const newIndex = index + direction;
	
	// Check if the move is valid
	if (newIndex < 0 || newIndex >= config.sections.length) {
		return;
	}
	
	// Swap sections
	const temp = config.sections[index];
	config.sections[index] = config.sections[newIndex];
	config.sections[newIndex] = temp;
	
	// Save changes and update UI
	window.configManager.saveConfig();
	renderSectionsList();
	window.tabManager.setupTabs();
}

function addSection() {
	editSection(-1); // -1 means new section
}

function editSection(index) {
	const config = window.configManager.getConfig();
	const section =
		index >= 0 ? config.sections[index] : { name: "", icon: "", items: [] };

	document.getElementById("section-name").value = section.name;
	document.getElementById("section-icon").value = section.icon;

	window.currentEditingSection = index;
	renderItemsList(section.items);
	document.getElementById("section-edit-dialog").showModal();
}

function closeSectionEdit() {
	document.getElementById("section-edit-dialog").close();
}

function renderItemsList(items) {
	const container = document.getElementById("items-list");

	container.innerHTML = items
		.map(
			(item, index) => `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
            <div>
                <label class="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Name</label>
                <input type="text" value="${item.name}" placeholder="Name" 
                    class="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white" 
                    onchange="updateItem(${index}, 'name', this.value)">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2 text-gray-900 dark:text-white">URL</label>
                <input type="text" value="${item.url}" placeholder="URL" 
                    class="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white" 
                    onchange="updateItem(${index}, 'url', this.value)">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Icon</label>
                <input type="text" value="${item.icon}" placeholder="Icon" 
                    class="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white" 
                    onchange="updateItem(${index}, 'icon', this.value)">
            </div>
            <div class="flex flex-col gap-2">
                <label class="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Color</label>
                <div class="flex gap-2">
                    <input type="color" value="${item.color}" 
                        class="w-12 h-12 rounded-xl border border-black/10 dark:border-white/10 cursor-pointer bg-white dark:bg-gray-800" 
                        onchange="updateItem(${index}, 'color', this.value)">
                    <button type="button" onclick="removeItem(${index})" 
                        class="flex-1 px-4 py-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/20 transition-colors font-medium">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `
		)
		.join("");
}

let currentEditingItems = [];

function addItem() {
	currentEditingItems.push({
		name: "",
		url: "",
		icon: "link",
		color: "#007aff"
	});
	renderItemsList(currentEditingItems);
}

function updateItem(index, field, value) {
	currentEditingItems[index][field] = value;
}

function removeItem(index) {
	currentEditingItems.splice(index, 1);
	renderItemsList(currentEditingItems);
}

function deleteSection() {
	if (
		window.currentEditingSection >= 0 &&
		confirm("Are you sure you want to delete this section?")
	) {
		const config = window.configManager.getConfig();
		config.sections.splice(window.currentEditingSection, 1);
		window.configManager.saveConfig();
		closeSectionEdit();
		renderSectionsList();
		window.tabManager.setupTabs();
	}
}

// Add to section form submit handler
document.getElementById("section-form").addEventListener("submit", (e) => {
	e.preventDefault();

	const config = window.configManager.getConfig();
	const sectionData = {
		id: Date.now().toString(),
		name: document.getElementById("section-name").value,
		icon: document.getElementById("section-icon").value,
		items: currentEditingItems
	};

	if (window.currentEditingSection >= 0) {
		config.sections[window.currentEditingSection] = {
			...config.sections[window.currentEditingSection],
			...sectionData
		};
	} else {
		config.sections.push(sectionData);
	}

	window.configManager.saveConfig();
	closeSectionEdit();
	renderSectionsList();
	window.tabManager.setupTabs();
});

document.addEventListener("DOMContentLoaded", () => {
	window.configManager = new ConfigManager();
	const weatherService = new WeatherService(window.configManager);
	const timeDisplay = new TimeDisplay();
	const searchManager = new SearchManager(window.configManager);
	window.tabManager = new TabManager(window.configManager);
	const vimNavigation = new VimNavigation(searchManager, window.tabManager);

	// Initialize editing items for section dialog
	currentEditingItems = [];

	// Set initial gradient
	const config = window.configManager.getConfig();
	if (config.selectedGradient) {
		changeGradient(config.selectedGradient);
	}

	// Get user's location
	navigator.geolocation.getCurrentPosition((position) => {
		weatherService.updateLocation(position.coords.latitude, position.coords.longitude);
	});
});
