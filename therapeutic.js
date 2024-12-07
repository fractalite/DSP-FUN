class TherapeuticModule {
    constructor() {
        this.isGenerating = false;
        this.setupListeners();
        this.loadFavorites();
    }

    setupListeners() {
        const generateBtn = document.getElementById('generate-btn');
        const saveBtn = document.getElementById('save-btn');
        const viewFavoritesBtn = document.getElementById('view-favorites-btn');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateAffirmation());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAffirmation());
        }
        if (viewFavoritesBtn) {
            viewFavoritesBtn.addEventListener('click', () => this.toggleFavorites());
        }
    }

    async generateAffirmation() {
        const intentionInput = document.getElementById('intention-input');
        const affirmationDisplay = document.getElementById('affirmation-display');
        const generateBtn = document.getElementById('generate-btn');
        
        if (!affirmationDisplay) return;
        
        const intention = intentionInput?.value?.trim() || '';
        
        if (!intention) {
            alert('Please enter your intention');
            return;
        }
        
        this.isGenerating = true;
        if (generateBtn) {
            generateBtn.textContent = 'Generating...';
            generateBtn.classList.add('active');
        }
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ intention })
            });

            if (!response.ok) {
                throw new Error('Failed to generate affirmation');
            }

            const data = await response.json();
            const affirmation = data.completion || 'Could not generate affirmation. Please try again.';
            
            affirmationDisplay.textContent = affirmation;
            affirmationDisplay.classList.add('show');
            
        } catch (error) {
            console.error('Error generating affirmation:', error);
            affirmationDisplay.textContent = 'Could not generate affirmation. Please try again.';
        } finally {
            this.isGenerating = false;
            if (generateBtn) {
                generateBtn.textContent = 'Generate';
                generateBtn.classList.remove('active');
            }
        }
    }

    stopGeneration() {
        this.isGenerating = false;
        const generateBtn = document.getElementById('generate-btn');
        
        if (generateBtn) {
            generateBtn.textContent = 'Generate';
            generateBtn.classList.remove('active');
        }
    }

    saveAffirmation() {
        const affirmationDisplay = document.getElementById('affirmation-display');
        if (!affirmationDisplay || !affirmationDisplay.textContent) return;
        
        const affirmation = affirmationDisplay.textContent;
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        if (!favorites.includes(affirmation)) {
            favorites.push(affirmation);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            this.updateFavoritesList();
            alert('Affirmation saved to favorites!');
        } else {
            alert('This affirmation is already in your favorites!');
        }
    }

    loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.updateFavoritesList(favorites);
    }

    updateFavoritesList() {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) return;
        
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        favoritesList.innerHTML = '';
        favorites.forEach(affirmation => {
            const li = document.createElement('li');
            li.textContent = affirmation;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => this.deleteFavorite(affirmation);
            
            li.appendChild(deleteBtn);
            favoritesList.appendChild(li);
        });
    }

    deleteFavorite(affirmation) {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const index = favorites.indexOf(affirmation);
        if (index > -1) {
            favorites.splice(index, 1);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            this.updateFavoritesList();
        }
    }

    toggleFavorites() {
        const favoritesPanel = document.getElementById('favorites-panel');
        if (favoritesPanel) {
            favoritesPanel.style.display = favoritesPanel.style.display === 'none' ? 'block' : 'none';
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.therapeuticModule = new TherapeuticModule();
});
