// Affirmation template system
const affirmationTemplates = {
    confidence: {
        name: "Confidence Building",
        templates: [
            "I am naturally and confidently [intention]",
            "Every day I become more capable of [intention]",
            "I trust in my ability to [intention]",
            "I have the inner strength to [intention]",
            "I am worthy and deserving of [intention]"
        ]
    },
    healing: {
        name: "Emotional Healing",
        templates: [
            "I am healing and releasing all that prevents me from [intention]",
            "I choose to let go and allow myself to [intention]",
            "My mind and body are aligned in helping me [intention]",
            "I deserve to heal and [intention]",
            "Each day I grow stronger as I [intention]"
        ]
    },
    growth: {
        name: "Personal Growth",
        templates: [
            "I am growing and evolving as I [intention]",
            "Every step I take brings me closer to [intention]",
            "I embrace the journey of [intention]",
            "I am becoming the person who can easily [intention]",
            "I celebrate my progress as I [intention]"
        ]
    },
    abundance: {
        name: "Abundance & Success",
        templates: [
            "I attract abundance as I [intention]",
            "I am worthy of success while I [intention]",
            "The universe supports me as I [intention]",
            "I am grateful for my ability to [intention]",
            "Success flows naturally as I [intention]"
        ]
    }
};

class AffirmationGenerator {
    constructor() {
        this.templates = affirmationTemplates;
        this.favorites = this.loadFavorites();
        this.aiAssistant = new AIAssistant();
        this.setupEventListeners();
        this.setupModals();
    }

    setupEventListeners() {
        // Get DOM elements
        this.categorySelect = document.getElementById('category-select');
        this.intentionInput = document.getElementById('intention-input');
        this.generateBtn = document.getElementById('generate-script');
        this.affirmationsArea = document.getElementById('affirmations-area');
        this.saveBtn = document.getElementById('save-affirmation');
        this.helpBtn = document.getElementById('help-affirmations');

        // Populate category select
        this.populateCategories();

        // Add event listeners
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', () => this.generateAffirmations());
        }
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveToFavorites());
        }
        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => {
                const modal = document.getElementById('ai-help-modal');
                if (modal) modal.style.display = 'block';
            });
        }

        // Close modal when clicking close button or outside
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => modal.style.display = 'none');
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    populateCategories() {
        if (!this.categorySelect) return;

        // Clear existing options except the first one
        while (this.categorySelect.options.length > 1) {
            this.categorySelect.remove(1);
        }

        // Add categories
        Object.entries(this.templates).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            this.categorySelect.appendChild(option);
        });
    }

    async generateAffirmations() {
        if (!this.categorySelect || !this.intentionInput || !this.affirmationsArea) return;

        const category = this.categorySelect.value;
        const intention = this.intentionInput.value.trim();

        if (!category || !intention) {
            alert('Please select a category and enter your intention.');
            return;
        }

        // Show loading state
        this.affirmationsArea.value = 'Generating personalized affirmations...';
        this.generateBtn.disabled = true;

        try {
            // Try AI generation first
            const aiAffirmations = await this.aiAssistant.generateAffirmations(
                this.templates[category].name,
                intention
            );

            if (aiAffirmations) {
                this.affirmationsArea.value = aiAffirmations;
            } else {
                // Fallback to template-based generation
                const templates = this.templates[category].templates;
                const affirmations = templates.map(template => 
                    template.replace('[intention]', intention.toLowerCase())
                );
                this.affirmationsArea.value = affirmations.join('\n\n');
            }
        } catch (error) {
            console.error('Generation Error:', error);
            // Fallback to template-based generation
            const templates = this.templates[category].templates;
            const affirmations = templates.map(template => 
                template.replace('[intention]', intention.toLowerCase())
            );
            this.affirmationsArea.value = affirmations.join('\n\n');
        } finally {
            this.generateBtn.disabled = false;
        }
    }

    saveToFavorites() {
        if (!this.affirmationsArea) return;

        const affirmations = this.affirmationsArea.value;
        if (!affirmations) {
            alert('Please generate affirmations first.');
            return;
        }

        const favorite = {
            category: this.categorySelect.value,
            intention: this.intentionInput.value,
            affirmations: affirmations,
            timestamp: new Date().toISOString()
        };

        this.favorites.push(favorite);
        this.saveFavorites();
        alert('Affirmations saved to favorites!');
    }

    loadFavorites() {
        const saved = localStorage.getItem('affirmationFavorites');
        return saved ? JSON.parse(saved) : [];
    }

    saveFavorites() {
        localStorage.setItem('affirmationFavorites', JSON.stringify(this.favorites));
    }

    setupModals() {
        // Get modal elements
        this.favoritesModal = document.getElementById('favorites-modal');
        this.favoritesList = document.getElementById('favorites-list');
        this.viewFavoritesBtn = document.getElementById('view-favorites');
        this.closeModalBtns = document.querySelectorAll('.close-modal');

        // Add event listeners
        if (this.viewFavoritesBtn) {
            this.viewFavoritesBtn.addEventListener('click', () => this.showFavorites());
        }

        // Close modal when clicking close button or outside
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.hideModals());
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModals();
            }
        });
    }

    showFavorites() {
        if (!this.favoritesList || !this.favoritesModal) return;

        // Clear existing content
        this.favoritesList.innerHTML = '';

        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = '<p class="no-favorites">No saved affirmations yet.</p>';
        } else {
            // Sort favorites by timestamp, newest first
            const sortedFavorites = [...this.favorites].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            sortedFavorites.forEach((favorite, index) => {
                const favoriteElement = document.createElement('div');
                favoriteElement.className = 'favorite-item';
                favoriteElement.innerHTML = `
                    <div class="favorite-header">
                        <h3>${this.templates[favorite.category].name}</h3>
                        <span class="favorite-date">${new Date(favorite.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p class="intention">Intention: ${favorite.intention}</p>
                    <div class="affirmation-text">${favorite.affirmations.split('\n\n').join('<br><br>')}</div>
                    <div class="favorite-actions">
                        <button class="load-favorite" data-index="${index}">Load</button>
                        <button class="delete-favorite" data-index="${index}">Delete</button>
                    </div>
                `;
                this.favoritesList.appendChild(favoriteElement);

                // Add event listeners for load and delete buttons
                const loadBtn = favoriteElement.querySelector('.load-favorite');
                const deleteBtn = favoriteElement.querySelector('.delete-favorite');

                loadBtn.addEventListener('click', () => this.loadFavorite(index));
                deleteBtn.addEventListener('click', () => this.deleteFavorite(index));
            });
        }

        this.favoritesModal.style.display = 'block';
    }

    hideModals() {
        if (this.favoritesModal) {
            this.favoritesModal.style.display = 'none';
        }
    }

    loadFavorite(index) {
        const favorite = this.favorites[index];
        if (!favorite) return;

        this.categorySelect.value = favorite.category;
        this.intentionInput.value = favorite.intention;
        this.affirmationsArea.value = favorite.affirmations;
        this.hideModals();
    }

    deleteFavorite(index) {
        if (confirm('Are you sure you want to delete this affirmation?')) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            this.showFavorites(); // Refresh the favorites list
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.affirmationGenerator = new AffirmationGenerator();
});
