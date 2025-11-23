// Shared navigation state management
const NavState = {
  campaignName: 'New Engagement Campaign',
  adSetName: 'New Engagement Ad Set',
  adName: 'New Engagement Ad',

  // Get names from localStorage or defaults
  init() {
    this.campaignName = localStorage.getItem('campaignName') || 'New Engagement Campaign';
    this.adSetName = localStorage.getItem('adSetName') || 'New Engagement Ad Set';
    this.adName = localStorage.getItem('adName') || 'New Engagement Ad';
  },

  // Save to localStorage
  saveCampaignName(name) {
    this.campaignName = name;
    localStorage.setItem('campaignName', name);
    this.updateAllInstances();
  },

  saveAdSetName(name) {
    this.adSetName = name;
    localStorage.setItem('adSetName', name);
    this.updateAllInstances();
  },

  saveAdName(name) {
    this.adName = name;
    localStorage.setItem('adName', name);
    this.updateAllInstances();
  },

  // Update all navigation instances on the page
  updateAllInstances() {
    // Update sidebar items
    const sidebarItems = document.querySelectorAll('.sidebar .tree-item');

    if (sidebarItems[0]) {
      const svg = sidebarItems[0].querySelector('svg');
      if (svg) {
        // 保留SVG，只更新文本
        sidebarItems[0].innerHTML = '';
        sidebarItems[0].appendChild(svg);
        sidebarItems[0].appendChild(document.createTextNode('\n          ' + this.campaignName + '\n        '));
      }
    }

    if (sidebarItems[1]) {
      const svg = sidebarItems[1].querySelector('svg');
      if (svg) {
        sidebarItems[1].innerHTML = '';
        sidebarItems[1].appendChild(svg);
        sidebarItems[1].appendChild(document.createTextNode('\n          ' + this.adSetName + '\n        '));
      }
    }

    if (sidebarItems[2]) {
      const svg = sidebarItems[2].querySelector('svg');
      if (svg) {
        sidebarItems[2].innerHTML = '';
        sidebarItems[2].appendChild(svg);
        sidebarItems[2].appendChild(document.createTextNode('\n          ' + this.adName + '\n        '));
      }
    }

    // Update breadcrumbs
    const crumbSpans = document.querySelectorAll('.crumbs > div > span');

    if (crumbSpans[0]) {
      const svg = crumbSpans[0].querySelector('svg');
      if (svg) {
        crumbSpans[0].innerHTML = '';
        crumbSpans[0].appendChild(svg);
        crumbSpans[0].appendChild(document.createTextNode('\n              ' + this.campaignName + '\n            '));
      }
    }

    if (crumbSpans[2]) {
      const svg = crumbSpans[2].querySelector('svg');
      if (svg) {
        crumbSpans[2].innerHTML = '';
        crumbSpans[2].appendChild(svg);
        crumbSpans[2].appendChild(document.createTextNode('\n              ' + this.adSetName + '\n            '));
      }
    }

    if (crumbSpans[4]) {
      const svg = crumbSpans[4].querySelector('svg');
      if (svg) {
        crumbSpans[4].innerHTML = '';
        crumbSpans[4].appendChild(svg);
        // 面包屑中显示 "1 Ad" 格式
        const adText = this.adName.replace('New Engagement ', '');
        crumbSpans[4].appendChild(document.createTextNode('\n              1 ' + adText + '\n            '));
      }
    }
  }
};

// Initialize on load
NavState.init();

// Listen for storage events from other tabs/windows
window.addEventListener('storage', (e) => {
  if (e.key === 'campaignName' || e.key === 'adSetName' || e.key === 'adName') {
    NavState.init();
    NavState.updateAllInstances();
  }
});

// Helper function to setup name input sync
function setupNameInputSync(inputId, saveFunction) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Load initial value
  input.value = saveFunction === NavState.saveCampaignName.bind(NavState) ? NavState.campaignName :
                saveFunction === NavState.saveAdSetName.bind(NavState) ? NavState.adSetName :
                NavState.adName;

  // Save on change
  input.addEventListener('input', (e) => {
    saveFunction(e.target.value);
  });

  input.addEventListener('blur', (e) => {
    saveFunction(e.target.value);
  });
}

// Update navigation on page load
document.addEventListener('DOMContentLoaded', () => {
  NavState.updateAllInstances();
});
