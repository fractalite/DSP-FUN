import AIAssistant from './ai-integration.js';

// Affirmation template system
class AffirmationGenerator {
    constructor() {
        this.favorites = this.loadFavorites();
        this.aiAssistant = new AIAssistant();
        this.setupEventListeners();
        this.setupModals();
    }

    setupEventListeners() {
        // Get DOM elements
        this.intentionInput = document.getElementById('intention-input');
        this.generateBtn = document.getElementById('generate-script');
        this.affirmationDisplay = document.getElementById('affirmation-display');
        this.saveBtn = document.getElementById('save-btn');
        this.helpBtn = document.getElementById('help-affirmations');
        this.viewFavoritesBtn = document.getElementById('view-favorites-btn');  

        if (!this.generateBtn || !this.affirmationDisplay) {
            console.error('Required elements not found');
            return;
        }

        // Add event listeners
        this.generateBtn.addEventListener('click', () => this.generateAffirmations());
        
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveToFavorites());
        }
        
        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => {
                const modal = document.getElementById('ai-help-modal');
                if (modal) modal.style.display = 'block';
            });
        }
        
        if (this.viewFavoritesBtn) {  
            this.viewFavoritesBtn.addEventListener('click', () => this.showFavorites());
        }

        // Add Enter key functionality
        if (this.intentionInput) {
            this.intentionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default form submission
                    this.generateAffirmations();
                }
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

    async generateAffirmations() {
        if (!this.intentionInput || !this.generateBtn || !this.affirmationDisplay) {
            console.error('Required elements not found');
            return;
        }

        const intention = this.intentionInput.value.trim();
        if (!intention) {
            this.affirmationDisplay.innerHTML = '<p class="error">Please enter an intention or goal.</p>';
            return;
        }

        this.generateBtn.disabled = true;
        this.affirmationDisplay.innerHTML = '<p class="loading">Generating affirmations...</p>';

        try {
            const response = await this.aiAssistant.generateAffirmations(intention);
            const affirmations = response.affirmations.split('\n');
            
            const container = document.createElement('div');
            container.className = 'affirmations-container';

            affirmations.forEach(affirmation => {
                if (affirmation.trim()) {
                    const p = document.createElement('p');
                    p.className = 'affirmation-item';
                    p.textContent = affirmation;
                    container.appendChild(p);
                }
            });

            this.affirmationDisplay.innerHTML = '';
            this.affirmationDisplay.appendChild(container);
            
            if (this.saveBtn) {
                this.saveBtn.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            this.affirmationDisplay.innerHTML = `
                <div class="error-message">
                    <p>${error.message}</p>
                </div>`;
        } finally {
            this.generateBtn.disabled = false;
        }
    }

    saveToFavorites() {
        if (!this.affirmationDisplay) return;

        const affirmations = this.affirmationDisplay.textContent;
        if (!affirmations || affirmations.includes('Generating') || affirmations.includes('Failed')) {
            alert('Please generate affirmations first.');
            return;
        }

        const favorite = {
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
        this.closeModalBtns = document.querySelectorAll('.close-modal');

        // Add event listeners
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
                        <h3>Intention: ${favorite.intention}</h3>
                        <span class="favorite-date">${new Date(favorite.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div class="affirmation-text">${favorite.affirmations}</div>
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

        this.intentionInput.value = favorite.intention;
        this.affirmationDisplay.textContent = favorite.affirmations;
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
document.addEventListener('DOMContentLoaded', async () => {
    const affirmationGenerator = new AffirmationGenerator();
    try {
        await affirmationGenerator.aiAssistant.init();
    } catch (error) {
        console.error('Initialization Error:', error);
    }
});
