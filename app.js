/**
 * PlateMaster Pro - Advanced Laboratory Tool
 * Complete JavaScript Application with Improved Visualization
 */

class PlateMasterPro {
    constructor() {
        // Plate configurations with accurate surface areas and volumes
        this.plateConfigs = {
            "6": { 
                rows: 2, 
                cols: 3, 
                rowLabels: ['A', 'B'],
                surfaceArea: 9.5, // cm² per well
                maxVolume: 3500, // µL
                workingVolume: 2500
            },
            "12": { 
                rows: 3, 
                cols: 4, 
                rowLabels: ['A', 'B', 'C'],
                surfaceArea: 3.8,
                maxVolume: 2200,
                workingVolume: 1500
            },
            "24": { 
                rows: 4, 
                cols: 6, 
                rowLabels: ['A', 'B', 'C', 'D'],
                surfaceArea: 1.9,
                maxVolume: 1000,
                workingVolume: 750
            },
            "48": { 
                rows: 6, 
                cols: 8, 
                rowLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
                surfaceArea: 0.75,
                maxVolume: 500,
                workingVolume: 350
            },
            "96": { 
                rows: 8, 
                cols: 12, 
                rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
                surfaceArea: 0.32,
                maxVolume: 360,
                workingVolume: 200
            },
            "384": { 
                rows: 16, 
                cols: 24, 
                rowLabels: Array.from({length: 16}, (_, i) => String.fromCharCode(65 + i)),
                surfaceArea: 0.087,
                maxVolume: 80,
                workingVolume: 50
            }
        };

        // Color schemes for different assay types
        this.colorSchemes = {
            default: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c', '#0891b2', '#be185d', '#f59e0b', '#6366f1', '#059669', '#d97706'],
            colorblind: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
            highContrast: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#800000', '#008000']
        };

        // Unit conversion factors
        this.conversionFactors = {
            // Molar conversions
            'M_mM': 1000,
            'mM_µM': 1000,
            'µM_nM': 1000,
            'nM_pM': 1000,
            
            // Mass conversions
            'g/L_mg/mL': 1,
            'mg/mL_µg/mL': 1000,
            'µg/mL_ng/mL': 1000,
            'ng/mL_pg/mL': 1000,
            
            // Volume conversions
            'L_mL': 1000,
            'mL_µL': 1000,
            'µL_nL': 1000,
            'nL_pL': 1000,
            
            // CFU conversions
            'CFU/mL_CFU/µL': 0.001,
            'cells/mL_cells/µL': 0.001
        };

        // Assay templates based on published protocols
        this.assayTemplates = {
            'mtt-viability': {
                name: 'MTT Cell Viability',
                description: 'Standard MTT viability assay for IC50 determination',
                groups: ['Control', 'Vehicle', '0.1µM', '0.3µM', '1µM', '3µM', '10µM', '30µM', '100µM'],
                timepoints: ['72h'],
                bioReplicates: 6,
                techReplicates: 1,
                plateFormat: '96',
                controls: true,
                blanks: true
            },
            'dose-response': {
                name: 'Dose-Response Curve',
                description: '8-point dose response with vehicle control',
                groups: ['Vehicle', '1nM', '3nM', '10nM', '30nM', '100nM', '300nM', '1µM', '3µM'],
                timepoints: ['24h', '48h'],
                bioReplicates: 4,
                techReplicates: 2,
                plateFormat: '96',
                controls: true,
                blanks: true
            },
            'antimicrobial-mic': {
                name: 'Antimicrobial MIC Assay',
                description: 'Minimum inhibitory concentration testing',
                groups: ['Growth Control', 'Sterility Control', '256µg/mL', '128µg/mL', '64µg/mL', '32µg/mL', '16µg/mL', '8µg/mL', '4µg/mL'],
                timepoints: ['18h'],
                bioReplicates: 3,
                techReplicates: 3,
                plateFormat: '96',
                controls: true,
                blanks: false
            },
            'time-course': {
                name: 'Time Course Study',
                description: 'Monitor changes over multiple time points',
                groups: ['Control', 'Treatment A', 'Treatment B'],
                timepoints: ['0h', '2h', '4h', '8h', '24h', '48h'],
                bioReplicates: 4,
                techReplicates: 2,
                plateFormat: '96',
                controls: true,
                blanks: true
            },
            'elisa-cytokine': {
                name: 'ELISA Cytokine Assay',
                description: 'Quantitative ELISA with standard curve',
                groups: ['Blank', '1000pg/mL', '500pg/mL', '250pg/mL', '125pg/mL', '62.5pg/mL', '31.25pg/mL', 'Sample 1:1', 'Sample 1:2'],
                timepoints: ['Endpoint'],
                bioReplicates: 1,
                techReplicates: 2,
                plateFormat: '96',
                controls: false,
                blanks: true
            }
        };

        // Application state
        this.currentLayout = [];
        this.currentColors = {};
        this.settings = this.loadSettings();
        this.zoomLevel = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabSwitching();
        this.loadTemplateCards();
        this.updateStats();
        this.drawEmptyPlate();
        this.showNotification('success', 'Welcome to PlateMaster Pro', 'Advanced laboratory tool ready for use');
    }

    setupEventListeners() {
        // Plate generation
        document.getElementById('generate-layout').addEventListener('click', () => {
            this.generatePlateLayout();
        });

        // Tag inputs
        this.setupTagInput('group-input', 'groups-container');
        this.setupTagInput('timepoint-input', 'timepoints-container');

        // Calculator buttons
        document.getElementById('calculate-dilution').addEventListener('click', () => {
            this.calculateDilution();
        });

        document.getElementById('calculate-cfu').addEventListener('click', () => {
            this.calculateCFUDistribution();
        });

        document.getElementById('convert-units').addEventListener('click', () => {
            this.convertUnits();
        });

        document.getElementById('calculate-power').addEventListener('click', () => {
            this.calculateStatisticalPower();
        });

        // Real-time unit conversion
        ['convert-from-value', 'convert-from-unit', 'convert-to-unit'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.convertUnitsRealTime();
                });
            }
        });

        // Plate format change
        document.getElementById('plate-format').addEventListener('change', () => {
            this.updateQuickStats();
            this.drawEmptyPlate();
        });

        // Real-time stats update
        ['bio-replicates', 'tech-replicates'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.updateQuickStats();
            });
        });

        // Template management
        document.getElementById('save-template').addEventListener('click', () => {
            this.saveCurrentTemplate();
        });

        // Export functions
        ['png', 'svg', 'csv', 'protocol'].forEach(format => {
            const btn = document.querySelector(`[onclick="exportPlate('${format}')"]`);
            if (btn) {
                btn.onclick = () => this.exportPlate(format);
            }
        });

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.zoomPlate(1.2);
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.zoomPlate(0.8);
        });

        // Settings
        document.getElementById('save-settings')?.addEventListener('click', () => {
            this.saveSettings();
        });
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Update button states
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update content visibility
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }

    setupTagInput(inputId, containerId) {
        const input = document.getElementById(inputId);
        const container = document.getElementById(containerId);

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                this.addTag(container, input.value.trim());
                input.value = '';
                this.updateQuickStats();
            }
        });
    }

    addTag(container, text) {
        // Check for duplicates
        const existingTags = Array.from(container.querySelectorAll('.tag')).map(tag => 
            tag.querySelector('span:first-child').textContent
        );
        
        if (existingTags.includes(text)) {
            this.showNotification('warning', 'Duplicate Entry', `"${text}" already exists`);
            return;
        }

        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            <span>${text}</span>
            <span class="tag-remove" onclick="this.parentElement.remove(); app.updateQuickStats();">×</span>
        `;
        
        const input = container.querySelector('.tag-input');
        container.insertBefore(tag, input);
    }

    getTags(containerId) {
        const container = document.getElementById(containerId);
        return Array.from(container.querySelectorAll('.tag span:first-child')).map(span => span.textContent);
    }

    generatePlateLayout() {
        const groups = this.getTags('groups-container');
        const timepoints = this.getTags('timepoints-container');
        const bioReps = parseInt(document.getElementById('bio-replicates').value) || 3;
        const techReps = parseInt(document.getElementById('tech-replicates').value) || 3;
        const plateFormat = document.getElementById('plate-format').value;
        const includeControls = document.getElementById('include-controls').checked;
        const includeBlanks = document.getElementById('include-blanks').checked;
        const randomize = document.getElementById('randomize-layout').checked;
        const edgeCorrection = document.getElementById('edge-effect-correction').checked;

        // Validation
        if (groups.length === 0) {
            this.showNotification('error', 'Missing Groups', 'Please add at least one treatment group');
            return;
        }

        if (timepoints.length === 0) {
            this.showNotification('error', 'Missing Timepoints', 'Please add at least one time point');
            return;
        }

        const config = this.plateConfigs[plateFormat];
        let totalWells = groups.length * timepoints.length * bioReps * techReps;

        // Add control wells
        if (includeControls) {
            totalWells += timepoints.length * bioReps * techReps * 2; // Positive and negative
        }

        if (includeBlanks) {
            totalWells += timepoints.length * techReps; // Blanks
        }

        const availableWells = config.rows * config.cols;

        if (totalWells > availableWells) {
            this.showNotification('error', 'Insufficient Wells', 
                `Design requires ${totalWells} wells but only ${availableWells} available`);
            return;
        }

        // Generate layout
        this.currentLayout = [];
        let wellIndex = 0;

        // Generate color scheme
        const colorScheme = this.settings.colorScheme || 'default';
        const colors = this.colorSchemes[colorScheme];
        this.currentColors = {};

        // Add experimental wells
        groups.forEach((group, groupIndex) => {
            this.currentColors[group] = colors[groupIndex % colors.length];
            
            timepoints.forEach(timepoint => {
                for (let b = 1; b <= bioReps; b++) {
                    for (let t = 1; t <= techReps; t++) {
                        if (wellIndex < availableWells) {
                            this.currentLayout.push({
                                group,
                                timepoint,
                                bioReplicate: b,
                                techReplicate: t,
                                well: this.getWellName(wellIndex, config),
                                type: 'experimental',
                                color: this.currentColors[group]
                            });
                            wellIndex++;
                        }
                    }
                }
            });
        });

        // Add control wells
        if (includeControls) {
            this.currentColors['Positive Control'] = '#f59e0b';
            this.currentColors['Negative Control'] = '#6b7280';

            timepoints.forEach(timepoint => {
                for (let b = 1; b <= bioReps; b++) {
                    for (let t = 1; t <= techReps; t++) {
                        // Positive control
                        if (wellIndex < availableWells) {
                            this.currentLayout.push({
                                group: 'Positive Control',
                                timepoint,
                                bioReplicate: b,
                                techReplicate: t,
                                well: this.getWellName(wellIndex, config),
                                type: 'control',
                                color: this.currentColors['Positive Control']
                            });
                            wellIndex++;
                        }

                        // Negative control
                        if (wellIndex < availableWells) {
                            this.currentLayout.push({
                                group: 'Negative Control',
                                timepoint,
                                bioReplicate: b,
                                techReplicate: t,
                                well: this.getWellName(wellIndex, config),
                                type: 'control',
                                color: this.currentColors['Negative Control']
                            });
                            wellIndex++;
                        }
                    }
                }
            });
        }

        // Add blank wells
        if (includeBlanks) {
            this.currentColors['Blank'] = '#06b6d4';

            timepoints.forEach(timepoint => {
                for (let t = 1; t <= techReps; t++) {
                    if (wellIndex < availableWells) {
                        this.currentLayout.push({
                            group: 'Blank',
                            timepoint,
                            bioReplicate: 1,
                            techReplicate: t,
                            well: this.getWellName(wellIndex, config),
                            type: 'blank',
                            color: this.currentColors['Blank']
                        });
                        wellIndex++;
                    }
                }
            });
        }

        // Apply edge effect correction
        if (edgeCorrection) {
            this.applyEdgeEffectCorrection();
        }

        // Randomize if requested
        if (randomize) {
            this.randomizeLayout();
        }

        // Draw the plate
        this.drawPlate();
        this.updateLegend();
        this.updateQuickStats();
        this.updateStats();

        // Update title
        const expName = document.getElementById('exp-name').value || 'Untitled Experiment';
        document.getElementById('plate-title').textContent = expName;

        this.showNotification('success', 'Layout Generated', 
            `Successfully created layout with ${this.currentLayout.length} wells`);
    }

    getWellName(index, config) {
        const row = config.rowLabels[Math.floor(index / config.cols)];
        const col = (index % config.cols) + 1;
        return `${row}${col}`;
    }

    applyEdgeEffectCorrection() {
        // Move important samples away from edge wells
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        
        // Identify edge wells
        const edgeWells = [];
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                if (r === 0 || r === config.rows - 1 || c === 0 || c === config.cols - 1) {
                    edgeWells.push(this.getWellName(r * config.cols + c, config));
                }
            }
        }

        // Swap experimental wells with controls/blanks if they're on edges
        this.currentLayout.forEach((well, index) => {
            if (well.type === 'experimental' && edgeWells.includes(well.well)) {
                // Find a non-edge control or blank to swap with
                const swapCandidate = this.currentLayout.find((w, i) => 
                    i !== index && 
                    (w.type === 'control' || w.type === 'blank') && 
                    !edgeWells.includes(w.well)
                );
                
                if (swapCandidate) {
                    const tempWell = well.well;
                    well.well = swapCandidate.well;
                    swapCandidate.well = tempWell;
                }
            }
        });
    }

    randomizeLayout() {
        // Fisher-Yates shuffle of well positions
        const wells = this.currentLayout.map(item => item.well);
        
        for (let i = wells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wells[i], wells[j]] = [wells[j], wells[i]];
        }
        
        this.currentLayout.forEach((item, index) => {
            item.well = wells[index];
        });
    }

    drawEmptyPlate() {
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        this.drawPlateStructure(config, []);
    }

    drawPlate() {
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        this.drawPlateStructure(config, this.currentLayout);
    }

    // **IMPROVED PLATE VISUALIZATION** - Main Change Here
    drawPlateStructure(config, layout) {
        const { rows, cols, rowLabels } = config;
        const plateContainer = document.getElementById('plate-container');
        
        // Clear container
        plateContainer.innerHTML = '';

        // Create main container with flex layout
        const mainContainer = document.createElement('div');
        mainContainer.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 2rem;
            justify-content: center;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            padding: 2rem;
            border-radius: 12px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        `;

        // Create plate SVG container
        const plateDiv = document.createElement('div');
        plateDiv.style.cssText = `
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;

        // Calculate dimensions for cleaner layout
        const cellSize = Math.min(50, 400 / Math.max(cols, rows));
        const padding = 60;
        const svgWidth = cols * cellSize + padding * 2;
        const svgHeight = rows * cellSize + padding * 2;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        svg.setAttribute('width', Math.min(500, svgWidth));
        svg.setAttribute('height', Math.min(400, svgHeight));
        svg.style.transform = `scale(${this.zoomLevel})`;
        svg.style.cssText += `
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        `;

        // Add subtle grid background
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'grid');
        pattern.setAttribute('width', cellSize);
        pattern.setAttribute('height', cellSize);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        const gridPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        gridPath.setAttribute('d', `M ${cellSize} 0 L 0 0 0 ${cellSize}`);
        gridPath.setAttribute('fill', 'none');
        gridPath.setAttribute('stroke', '#f1f5f9');
        gridPath.setAttribute('stroke-width', '1');
        
        pattern.appendChild(gridPath);
        defs.appendChild(pattern);
        svg.appendChild(defs);

        // Background with grid
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', svgWidth);
        bgRect.setAttribute('height', svgHeight);
        bgRect.setAttribute('fill', '#fafafa');
        svg.appendChild(bgRect);

        const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        gridRect.setAttribute('x', padding);
        gridRect.setAttribute('y', padding);
        gridRect.setAttribute('width', cols * cellSize);
        gridRect.setAttribute('height', rows * cellSize);
        gridRect.setAttribute('fill', 'url(#grid)');
        svg.appendChild(gridRect);

        // Draw row labels (A, B, C...)
        for (let i = 0; i < rows; i++) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding - 20);
            text.setAttribute('y', i * cellSize + padding + cellSize / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.style.cssText = `
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 600;
                fill: #475569;
            `;
            text.textContent = rowLabels[i];
            svg.appendChild(text);
        }

        // Draw column labels (1, 2, 3...)
        for (let j = 0; j < cols; j++) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', j * cellSize + padding + cellSize / 2);
            text.setAttribute('y', padding - 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.style.cssText = `
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 600;
                fill: #475569;
            `;
            text.textContent = j + 1;
            svg.appendChild(text);
        }

        // Draw wells - CLEAN VERSION WITH NO TEXT INSIDE
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const wellName = `${rowLabels[i]}${j + 1}`;
                const wellData = layout.find(w => w.well === wellName);
                
                const cx = j * cellSize + padding + cellSize / 2;
                const cy = i * cellSize + padding + cellSize / 2;
                const radius = cellSize * 0.35;

                // Create well circle - CLEAN DESIGN
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', cx);
                circle.setAttribute('cy', cy);
                circle.setAttribute('r', radius);
                circle.style.cssText = `
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;

                if (wellData) {
                    circle.setAttribute('fill', wellData.color);
                    circle.setAttribute('stroke', this.darkenColor(wellData.color, 15));
                    circle.setAttribute('stroke-width', '2');
                    
                    // Add subtle shadow for depth
                    circle.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))';
                    
                    // Special styling for different types
                    if (wellData.type === 'control') {
                        circle.setAttribute('stroke-dasharray', '3,2');
                        circle.setAttribute('stroke-width', '2.5');
                    } else if (wellData.type === 'blank') {
                        circle.setAttribute('stroke-dasharray', '2,1');
                        circle.setAttribute('stroke-width', '2');
                    }
                } else {
                    circle.setAttribute('fill', '#f8fafc');
                    circle.setAttribute('stroke', '#cbd5e1');
                    circle.setAttribute('stroke-width', '1');
                }

                // Enhanced hover effects
                circle.addEventListener('mouseenter', (e) => {
                    circle.style.transform = 'scale(1.1)';
                    circle.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15)) brightness(1.05)';
                    this.showTooltip(e, wellData, wellName);
                });

                circle.addEventListener('mouseleave', () => {
                    circle.style.transform = 'scale(1)';
                    circle.style.filter = wellData ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' : 'none';
                    this.hideTooltip();
                });

                circle.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));

                svg.appendChild(circle);
            }
        }

        // Add plate border
        const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        border.setAttribute('x', padding - 10);
        border.setAttribute('y', padding - 10);
        border.setAttribute('width', cols * cellSize + 20);
        border.setAttribute('height', rows * cellSize + 20);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#94a3b8');
        border.setAttribute('stroke-width', '2');
        border.setAttribute('stroke-dasharray', '5,5');
        border.setAttribute('rx', '8');
        svg.appendChild(border);

        plateDiv.appendChild(svg);

        // Add plate format info below SVG
        const plateInfo = document.createElement('div');
        plateInfo.style.cssText = `
            margin-top: 1rem;
            text-align: center;
            font-size: 0.9rem;
            color: #64748b;
            font-weight: 500;
        `;
        plateInfo.innerHTML = `
            <div>${config.rows}×${config.cols} (${rows * cols} wells)</div>
            <div>${config.surfaceArea} cm² per well</div>
        `;
        plateDiv.appendChild(plateInfo);

        // Create side legend - IMPROVED DESIGN
        const legendDiv = document.createElement('div');
        legendDiv.style.cssText = `
            flex: 0 0 250px;
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            max-height: 400px;
            overflow-y: auto;
        `;

        // Legend title
        const legendTitle = document.createElement('h3');
        legendTitle.style.cssText = `
            margin: 0 0 1rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        `;
        legendTitle.innerHTML = '<i class="fas fa-palette" style="color: #3b82f6;"></i> Group Legend';
        legendDiv.appendChild(legendTitle);

        // Legend items
        if (layout.length > 0) {
            const uniqueGroups = [...new Set(layout.map(item => item.group))];
            
            uniqueGroups.forEach(group => {
                const legendItem = document.createElement('div');
                legendItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    margin-bottom: 0.5rem;
                    background: #f8fafc;
                    border-radius: 6px;
                    border: 1px solid #f1f5f9;
                    transition: all 0.2s ease;
                `;

                // Color square
                const colorSquare = document.createElement('div');
                colorSquare.style.cssText = `
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    background-color: ${this.currentColors[group]};
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    flex-shrink: 0;
                `;

                // Group info
                const groupInfo = document.createElement('div');
                groupInfo.style.cssText = `
                    flex: 1;
                `;

                const groupName = document.createElement('div');
                groupName.style.cssText = `
                    font-weight: 500;
                    color: #1e293b;
                    font-size: 0.9rem;
                    line-height: 1.2;
                `;
                groupName.textContent = group;

                const groupDetails = document.createElement('div');
                groupDetails.style.cssText = `
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                `;
                
                const groupWells = layout.filter(item => item.group === group);
                const wellCount = groupWells.length;
                const firstWell = groupWells[0];
                
                groupDetails.innerHTML = `
                    ${wellCount} wells • ${firstWell ? firstWell.type : 'experimental'}
                `;

                groupInfo.appendChild(groupName);
                groupInfo.appendChild(groupDetails);

                // Hover effects
                legendItem.addEventListener('mouseenter', () => {
                    legendItem.style.background = '#e2e8f0';
                    legendItem.style.transform = 'translateX(3px)';
                    
                    // Highlight corresponding wells
                    const wells = svg.querySelectorAll('circle');
                    wells.forEach(well => {
                        const wellData = layout.find(w => {
                            const rect = well.getBoundingClientRect();
                            return w.group === group;
                        });
                        if (wellData && wellData.group === group) {
                            well.style.transform = 'scale(1.15)';
                            well.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) brightness(1.1)';
                        }
                    });
                });

                legendItem.addEventListener('mouseleave', () => {
                    legendItem.style.background = '#f8fafc';
                    legendItem.style.transform = 'translateX(0)';
                    
                    // Reset wells
                    const wells = svg.querySelectorAll('circle');
                    wells.forEach(well => {
                        well.style.transform = 'scale(1)';
                        well.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))';
                    });
                });

                legendItem.appendChild(colorSquare);
                legendItem.appendChild(groupInfo);
                legendDiv.appendChild(legendItem);
            });

            // Add summary info
            if (uniqueGroups.length > 0) {
                const summaryDiv = document.createElement('div');
                summaryDiv.style.cssText = `
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
                    font-size: 0.8rem;
                    color: #64748b;
                `;
                
                summaryDiv.innerHTML = `
                    <div style="margin-bottom: 0.5rem;"><strong>Total Groups:</strong> ${uniqueGroups.length}</div>
                    <div style="margin-bottom: 0.5rem;"><strong>Wells Used:</strong> ${layout.length}</div>
                    <div><strong>Utilization:</strong> ${((layout.length / (rows * cols)) * 100).toFixed(1)}%</div>
                `;
                legendDiv.appendChild(summaryDiv);
            }
        } else {
            // Empty state
            const emptyState = document.createElement('div');
            emptyState.style.cssText = `
                text-align: center;
                color: #94a3b8;
                font-style: italic;
                padding: 2rem;
            `;
            emptyState.innerHTML = `
                <i class="fas fa-flask" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <div>Generate a layout to see the legend</div>
            `;
            legendDiv.appendChild(emptyState);
        }

        // Assemble the complete visualization
        mainContainer.appendChild(plateDiv);
        mainContainer.appendChild(legendDiv);
        plateContainer.appendChild(mainContainer);
    }

    showTooltip(event, wellData, wellName) {
        const tooltip = document.getElementById('tooltip');
        
        if (wellData) {
            const plateFormat = document.getElementById('plate-format').value;
            const surfaceArea = this.plateConfigs[plateFormat].surfaceArea;
            
            tooltip.innerHTML = `
                <div class="tooltip-title">Well ${wellName}</div>
                <div style="margin-top: 0.5rem; line-height: 1.4;">
                    <strong>Group:</strong> ${wellData.group}<br>
                    <strong>Time:</strong> ${wellData.timepoint}<br>
                    <strong>Bio Rep:</strong> ${wellData.bioReplicate} | <strong>Tech Rep:</strong> ${wellData.techReplicate}<br>
                    <strong>Type:</strong> ${wellData.type}<br>
                    <strong>Surface:</strong> ${surfaceArea} cm²
                </div>
            `;
        } else {
            tooltip.innerHTML = `
                <div class="tooltip-title">Well ${wellName}</div>
                <div style="margin-top: 0.5rem; color: #94a3b8; font-style: italic;">Empty well</div>
            `;
        }

        this.updateTooltipPosition(event);
        tooltip.classList.add('show');
    }

    updateTooltipPosition(event) {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.left = `${event.pageX + 15}px`;
        tooltip.style.top = `${event.pageY - 10}px`;
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.remove('show');
    }

    updateLegend() {
        // Legend is now handled within drawPlateStructure
        // This method is kept for compatibility
    }

    updateQuickStats() {
        const groups = this.getTags('groups-container');
        const timepoints = this.getTags('timepoints-container');
        const bioReps = parseInt(document.getElementById('bio-replicates').value) || 0;
        const techReps = parseInt(document.getElementById('tech-replicates').value) || 0;
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];

        const experimentalWells = groups.length * timepoints.length * bioReps * techReps;
        const controlWells = document.getElementById('include-controls')?.checked ? 
            timepoints.length * bioReps * techReps * 2 : 0;
        const blankWells = document.getElementById('include-blanks')?.checked ? 
            timepoints.length * techReps : 0;
        
        const totalNeeded = experimentalWells + controlWells + blankWells;
        const available = config.rows * config.cols;
        const utilization = available > 0 ? (totalNeeded / available * 100).toFixed(1) : 0;
        const totalSurfaceArea = (totalNeeded * config.surfaceArea).toFixed(2);

        document.getElementById('wells-needed').textContent = totalNeeded;
        document.getElementById('wells-available').textContent = available;
        document.getElementById('utilization').textContent = `${utilization}%`;
        document.getElementById('surface-area').textContent = totalSurfaceArea;
    }

    // Calculator Functions
    calculateDilution() {
        const stockConc = parseFloat(document.getElementById('stock-conc').value);
        const stockUnit = document.getElementById('stock-unit').value;
        const targetConc = parseFloat(document.getElementById('target-conc').value);
        const targetUnit = document.getElementById('target-unit').value;
        const finalVol = parseFloat(document.getElementById('final-volume').value);
        const volUnit = document.getElementById('volume-unit').value;

        if (isNaN(stockConc) || isNaN(targetConc) || isNaN(finalVol) || stockConc <= 0 || targetConc <= 0 || finalVol <= 0) {
            this.showNotification('error', 'Input Error', 'Please enter valid positive numbers for all fields');
            return;
        }

        // Convert concentrations to a common unit (µM for molar, µg/mL for mass)
        const stockConcBase = this.convertConcentrationToBase(stockConc, stockUnit);
        const targetConcBase = this.convertConcentrationToBase(targetConc, targetUnit);
        const finalVolBase = this.convertVolumeToMicroliters(finalVol, volUnit);

        if (stockConcBase <= targetConcBase) {
            this.showNotification('error', 'Concentration Error', 'Stock concentration must be higher than target concentration');
            return;
        }

        // C1V1 = C2V2 calculation
        const volStock = (targetConcBase * finalVolBase) / stockConcBase;
        const volDiluent = finalVolBase - volStock;
        const dilutionFactor = stockConcBase / targetConcBase;

        // Generate batch preparation table
        const batchSizes = [1, 5, 10, 25, 50];
        const batches = batchSizes.map(multiplier => ({
            size: multiplier,
            stockVol: (volStock * multiplier).toFixed(2),
            diluentVol: (volDiluent * multiplier).toFixed(2),
            totalVol: (finalVolBase * multiplier).toFixed(2)
        }));

        const resultDiv = document.getElementById('dilution-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-flask"></i> Dilution Protocol</h4>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p><strong>Stock volume needed:</strong> ${volStock.toFixed(3)} µL</p>
                <p><strong>Diluent volume:</strong> ${volDiluent.toFixed(3)} µL</p>
                <p><strong>Final volume:</strong> ${finalVolBase} µL</p>
                <p><strong>Dilution factor:</strong> ${dilutionFactor.toFixed(2)}×</p>
            </div>
            
            <div style="margin-top: 15px;">
                <h5><i class="fas fa-table"></i> Batch Preparation Guide</h5>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Batch Size</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Stock (µL)</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Diluent (µL)</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Total (µL)</th>
                    </tr>
                    ${batches.map(batch => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${batch.size}×</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${batch.stockVol}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${batch.diluentVol}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${batch.totalVol}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    convertConcentrationToBase(value, unit) {
        // Convert to µM for molar units, µg/mL for mass units, CFU/mL for biological units
        const molarConversions = {
            'M': 1e6, 'mM': 1e3, 'µM': 1, 'nM': 1e-3, 'pM': 1e-6
        };
        
        const massConversions = {
            'g/L': 1e3, 'mg/mL': 1, 'µg/mL': 1, 'ng/mL': 1e-3, 'pg/mL': 1e-6
        };
        
        const biologicalConversions = {
            'CFU/mL': 1, 'CFU/µL': 1e3, 'cells/mL': 1, 'cells/µL': 1e3, 'IU/mL': 1, 'U/mL': 1
        };

        if (molarConversions[unit]) return value * molarConversions[unit];
        if (massConversions[unit]) return value * massConversions[unit];
        if (biologicalConversions[unit]) return value * biologicalConversions[unit];
        
        // Handle percentage units
        if (unit.includes('%')) return value * 1e4;
        
        return value; // Default if unit not found
    }

    convertVolumeToMicroliters(value, unit) {
        const conversions = {
            'L': 1e6, 'mL': 1e3, 'µL': 1
        };
        return value * (conversions[unit] || 1e3); // Default to mL if unit not found
    }

    calculateCFUDistribution() {
        const stockCFU = parseFloat(document.getElementById('cfu-stock').value);
        const stockUnit = document.getElementById('cfu-stock-unit').value;
        const targetCFU = parseFloat(document.getElementById('target-cfu').value);
        const targetUnit = document.getElementById('target-cfu-unit').value;
        const wellVolume = parseFloat(document.getElementById('well-volume').value);
        const wellCount = parseInt(document.getElementById('well-count').value);
        const plateFormat = document.getElementById('plate-format').value;

        if (isNaN(stockCFU) || isNaN(targetCFU) || isNaN(wellVolume) || isNaN(wellCount)) {
            this.showNotification('error', 'Input Error', 'Please enter valid numbers for all CFU fields');
            return;
        }

        // Convert CFU to common unit (CFU/mL)
        let stockCFUBase = stockCFU;
        let targetCFUBase = targetCFU;

        if (stockUnit === 'CFU/µL') stockCFUBase *= 1000;
        if (targetUnit === 'CFU/µL') targetCFUBase *= 1000;
        if (targetUnit === 'CFU/cm²') {
            const surfaceArea = this.plateConfigs[plateFormat].surfaceArea;
            targetCFUBase = targetCFU * surfaceArea * (wellVolume / 1000); // Convert to CFU/mL
        }
        if (targetUnit === 'CFU/well') {
            targetCFUBase = targetCFU / (wellVolume / 1000); // Convert to CFU/mL
        }

        if (stockCFUBase <= targetCFUBase) {
            this.showNotification('error', 'CFU Error', 'Stock CFU must be higher than target CFU');
            return;
        }

        const totalVolume = wellVolume * wellCount; // µL
        const dilutionFactor = stockCFUBase / targetCFUBase;
        const volumeStock = totalVolume / dilutionFactor;
        const diluentVolume = totalVolume - volumeStock;

        // Surface area calculations
        const surfaceArea = this.plateConfigs[plateFormat].surfaceArea;
        const cfuPerCm2 = targetCFUBase * (wellVolume / 1000) / surfaceArea;
        const totalSurfaceArea = surfaceArea * wellCount;
        const totalCFUNeeded = targetCFUBase * (totalVolume / 1000);

        const resultDiv = document.getElementById('cfu-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-bacteria"></i> CFU Distribution & Surface Analysis</h4>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p><strong>Stock volume needed:</strong> ${volumeStock.toFixed(2)} µL</p>
                <p><strong>Diluent volume:</strong> ${diluentVolume.toFixed(2)} µL</p>
                <p><strong>Total volume:</strong> ${totalVolume} µL</p>
                <p><strong>Dilution factor:</strong> ${dilutionFactor.toExponential(2)}</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 10px; border-radius: 6px; margin: 10px 0;">
                <h5><i class="fas fa-ruler-combined"></i> Surface Area Analysis</h5>
                <p><strong>CFU per cm²:</strong> ${cfuPerCm2.toExponential(2)}</p>
                <p><strong>Total surface area:</strong> ${totalSurfaceArea.toFixed(2)} cm²</p>
                <p><strong>Well surface area:</strong> ${surfaceArea} cm²</p>
                <p><strong>Total CFU needed:</strong> ${totalCFUNeeded.toExponential(2)}</p>
            </div>

            <div style="background: #fefce8; padding: 10px; border-radius: 6px; margin: 10px 0;">
                <h5><i class="fas fa-exclamation-triangle"></i> Protocol Notes</h5>
                <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
                    <li>Use sterile technique throughout preparation</li>
                    <li>Prepare bacterial dilution fresh before use</li>
                    <li>Mix gently to avoid cell damage</li>
                    <li>Consider bacterial adhesion properties for surface studies</li>
                    <li>Validate CFU counts with serial dilution plating</li>
                </ul>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    convertUnits() {
        const value = parseFloat(document.getElementById('convert-from-value').value);
        const fromUnit = document.getElementById('convert-from-unit').value;
        const toUnit = document.getElementById('convert-to-unit').value;

        if (isNaN(value)) {
            this.showNotification('warning', 'Input Error', 'Please enter a valid number');
            return;
        }

        let result = value;

        // Volume conversions
        const volumeConversions = {
            'L_mL': 1000, 'mL_L': 0.001, 'mL_µL': 1000, 'µL_mL': 0.001,
            'µL_nL': 1000, 'nL_µL': 0.001, 'nL_pL': 1000, 'pL_nL': 0.001
        };

        // Mass conversions
        const massConversions = {
            'kg_g': 1000, 'g_kg': 0.001, 'g_mg': 1000, 'mg_g': 0.001,
            'mg_µg': 1000, 'µg_mg': 0.001, 'µg_ng': 1000, 'ng_µg': 0.001,
            'ng_pg': 1000, 'pg_ng': 0.001
        };

        // Molar conversions
        const molarConversions = {
            'mol_mmol': 1000, 'mmol_mol': 0.001, 'mmol_µmol': 1000, 'µmol_mmol': 0.001,
            'µmol_nmol': 1000, 'nmol_µmol': 0.001, 'nmol_pmol': 1000, 'pmol_nmol': 0.001
        };

        const conversionKey = `${fromUnit}_${toUnit}`;
        const allConversions = { ...volumeConversions, ...massConversions, ...molarConversions };

        if (fromUnit === toUnit) {
            result = value;
        } else if (allConversions[conversionKey]) {
            result = value * allConversions[conversionKey];
        } else {
            this.showNotification('error', 'Conversion Error', `Cannot convert from ${fromUnit} to ${toUnit}`);
            return;
        }

        document.getElementById('convert-result').value = result.toPrecision(6);
    }

    convertUnitsRealTime() {
        const value = document.getElementById('convert-from-value').value;
        if (value && !isNaN(parseFloat(value))) {
            this.convertUnits();
        } else {
            document.getElementById('convert-result').value = '';
        }
    }

    calculateStatisticalPower() {
        const effectSize = parseFloat(document.getElementById('effect-size').value);
        const alpha = parseFloat(document.getElementById('alpha-level').value);
        const power = parseFloat(document.getElementById('power-level').value);
        const groups = parseInt(document.getElementById('group-count').value);

        if (isNaN(effectSize) || isNaN(alpha) || isNaN(power) || isNaN(groups)) {
            this.showNotification('error', 'Input Error', 'Please fill all power analysis fields');
            return;
        }

        // Simplified power analysis for two-sample t-test
        const zAlpha = this.getZScore(1 - alpha / 2);
        const zBeta = this.getZScore(power);
        const nPerGroup = Math.ceil((2 * Math.pow(zAlpha + zBeta, 2)) / Math.pow(effectSize, 2));
        const totalSample = nPerGroup * groups;

        // Additional scenarios
        const scenarios = [
            { alpha: 0.05, power: 0.8 },
            { alpha: 0.05, power: 0.9 },
            { alpha: 0.01, power: 0.8 },
            { alpha: 0.01, power: 0.9 }
        ].map(scenario => {
            const zA = this.getZScore(1 - scenario.alpha / 2);
            const zB = this.getZScore(scenario.power);
            const n = Math.ceil((2 * Math.pow(zA + zB, 2)) / Math.pow(effectSize, 2));
            return {
                alpha: scenario.alpha,
                power: scenario.power,
                nPerGroup: n,
                total: n * groups
            };
        });

        const resultDiv = document.getElementById('power-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-chart-area"></i> Statistical Power Analysis</h4>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p><strong>Recommended sample size per group:</strong> ${nPerGroup}</p>
                <p><strong>Total sample size needed:</strong> ${totalSample}</p>
                <p><strong>Effect size (Cohen's d):</strong> ${effectSize}</p>
                <p><strong>Alpha level (α):</strong> ${alpha}</p>
                <p><strong>Statistical power (1-β):</strong> ${power}</p>
            </div>

            <div style="margin-top: 15px;">
                <h5><i class="fas fa-table"></i> Alternative Scenarios</h5>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Alpha</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Power</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Per Group</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Total</th>
                    </tr>
                    ${scenarios.map(s => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${s.alpha}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${s.power}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${s.nPerGroup}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${s.total}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    getZScore(probability) {
        // Approximate inverse normal CDF for common probabilities
        const zScores = {
            0.5: 0, 0.8: 0.842, 0.9: 1.282, 0.95: 1.645,
            0.975: 1.96, 0.99: 2.326, 0.995: 2.576
        };
        return zScores[probability] || 1.96; // Default to 95% confidence
    }

    loadTemplateCards() {
        const container = document.getElementById('template-cards');
        if (!container) return;

        container.innerHTML = '';
        
        Object.entries(this.assayTemplates).forEach(([key, template]) => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <h4>${template.name}</h4>
                <p>${template.description}</p>
                <div class="template-meta">
                    <span>${template.groups.length} groups</span>
                    <span>${template.plateFormat}-well</span>
                </div>
            `;
            card.addEventListener('click', () => this.loadAssayTemplate(key));
            container.appendChild(card);
        });
    }

    loadAssayTemplate(templateKey) {
        const template = this.assayTemplates[templateKey];
        if (!template) return;

        // Set basic parameters
        document.getElementById('exp-name').value = template.name;
        document.getElementById('plate-format').value = template.plateFormat;
        document.getElementById('bio-replicates').value = template.bioReplicates;
        document.getElementById('tech-replicates').value = template.techReplicates;
        document.getElementById('include-controls').checked = template.controls;
        document.getElementById('include-blanks').checked = template.blanks;

        // Clear and set groups
        this.clearTags('groups-container');
        template.groups.forEach(group => {
            this.addTag(document.getElementById('groups-container'), group);
        });

        // Clear and set timepoints
        this.clearTags('timepoints-container');
        template.timepoints.forEach(timepoint => {
            this.addTag(document.getElementById('timepoints-container'), timepoint);
        });

        this.updateQuickStats();
        this.showNotification('success', 'Template Loaded', `${template.name} template applied successfully`);
    }

    clearTags(containerId) {
        const container = document.getElementById(containerId);
        const tags = container.querySelectorAll('.tag');
        tags.forEach(tag => tag.remove());
    }

    saveCurrentTemplate() {
        const templateName = document.getElementById('template-name').value.trim();
        if (!templateName) {
            this.showNotification('warning', 'Template Name Required', 'Please enter a name for your template');
            return;
        }

        const template = {
            name: templateName,
            expName: document.getElementById('exp-name').value,
            plateFormat: document.getElementById('plate-format').value,
            groups: this.getTags('groups-container'),
            timepoints: this.getTags('timepoints-container'),
            bioReplicates: parseInt(document.getElementById('bio-replicates').value),
            techReplicates: parseInt(document.getElementById('tech-replicates').value),
            controls: document.getElementById('include-controls').checked,
            blanks: document.getElementById('include-blanks').checked,
            created: new Date().toISOString()
        };

        const savedTemplates = JSON.parse(localStorage.getItem('plateMasterTemplates') || '{}');
        savedTemplates[templateName] = template;
        localStorage.setItem('plateMasterTemplates', JSON.stringify(savedTemplates));

        document.getElementById('template-name').value = '';
        this.loadSavedTemplates();
        this.showNotification('success', 'Template Saved', `Template "${templateName}" saved successfully`);
    }

    loadSavedTemplates() {
        const container = document.getElementById('saved-templates');
        if (!container) return;

        const savedTemplates = JSON.parse(localStorage.getItem('plateMasterTemplates') || '{}');
        container.innerHTML = '';

        Object.entries(savedTemplates).forEach(([name, template]) => {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.innerHTML = `
                <div>
                    <div class="template-item-name">${name}</div>
                    <div class="template-item-date">${new Date(template.created).toLocaleDateString()}</div>
                </div>
                <div class="template-actions">
                    <button class="btn btn-primary" onclick="app.loadSavedTemplate('${name}')">Load</button>
                    <button class="btn btn-danger" onclick="app.deleteSavedTemplate('${name}')">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    loadSavedTemplate(templateName) {
        const savedTemplates = JSON.parse(localStorage.getItem('plateMasterTemplates') || '{}');
        const template = savedTemplates[templateName];
        if (!template) return;

        // Load template data
        document.getElementById('exp-name').value = template.expName || '';
        document.getElementById('plate-format').value = template.plateFormat || '96';
        document.getElementById('bio-replicates').value = template.bioReplicates || 3;
        document.getElementById('tech-replicates').value = template.techReplicates || 3;
        document.getElementById('include-controls').checked = template.controls !== false;
        document.getElementById('include-blanks').checked = template.blanks !== false;

        // Load groups and timepoints
        this.clearTags('groups-container');
        this.clearTags('timepoints-container');

        template.groups.forEach(group => {
            this.addTag(document.getElementById('groups-container'), group);
        });

        template.timepoints.forEach(timepoint => {
            this.addTag(document.getElementById('timepoints-container'), timepoint);
        });

        this.updateQuickStats();
        this.showNotification('success', 'Template Loaded', `Template "${templateName}" loaded successfully`);
    }

    deleteSavedTemplate(templateName) {
        if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) return;

        const savedTemplates = JSON.parse(localStorage.getItem('plateMasterTemplates') || '{}');
        delete savedTemplates[templateName];
        localStorage.setItem('plateMasterTemplates', JSON.stringify(savedTemplates));

        this.loadSavedTemplates();
        this.showNotification('success', 'Template Deleted', `Template "${templateName}" deleted successfully`);
    }

    zoomPlate(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel)); // Limit zoom range
        
        const svg = document.querySelector('#plate-container svg');
        if (svg) {
            svg.style.transform = `scale(${this.zoomLevel})`;
        }
    }

    exportPlate(format) {
        if (this.currentLayout.length === 0) {
            this.showNotification('warning', 'No Layout', 'Please generate a plate layout first');
            return;
        }

        switch (format) {
            case 'png':
                this.exportAsPNG();
                break;
            case 'svg':
                this.exportAsSVG();
                break;
            case 'csv':
                this.exportAsCSV();
                break;
            case 'protocol':
                this.exportAsProtocol();
                break;
        }
    }

    exportAsSVG() {
        const svg = document.querySelector('#plate-container svg');
        if (!svg) return;

        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${document.getElementById('exp-name').value || 'plate-layout'}.svg`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'Export Complete', 'SVG file downloaded successfully');
    }

    exportAsPNG() {
        const svg = document.querySelector('#plate-container svg');
        if (!svg) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);

        const img = new Image();
        const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));

        img.onload = () => {
            canvas.width = img.width * 2; // High resolution
            canvas.height = img.height * 2;
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(blob => {
                const link = document.createElement('a');
                link.download = `${document.getElementById('exp-name').value || 'plate-layout'}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            });

            URL.revokeObjectURL(url);
            this.showNotification('success', 'Export Complete', 'PNG file downloaded successfully');
        };

        img.src = url;
    }

    exportAsCSV() {
        let csv = 'Well,Group,Timepoint,BioReplicate,TechReplicate,Type,Color\n';
        
        this.currentLayout.forEach(item => {
            csv += `"${item.well}","${item.group}","${item.timepoint}","${item.bioReplicate}","${item.techReplicate}","${item.type}","${item.color}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${document.getElementById('exp-name').value || 'plate-layout'}.csv`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'Export Complete', 'CSV file downloaded successfully');
    }

    exportAsProtocol() {
        const expName = document.getElementById('exp-name').value || 'Untitled Experiment';
        const plateFormat = document.getElementById('plate-format').value;
        const groups = [...new Set(this.currentLayout.map(item => item.group))];
        
        let protocol = `EXPERIMENTAL PROTOCOL\n`;
        protocol += `===================\n\n`;
        protocol += `Experiment: ${expName}\n`;
        protocol += `Date: ${new Date().toLocaleDateString()}\n`;
        protocol += `Plate Format: ${plateFormat}-well\n`;
        protocol += `Total Wells Used: ${this.currentLayout.length}\n\n`;
        
        protocol += `GROUPS:\n`;
        groups.forEach(group => {
            protocol += `- ${group}\n`;
        });
        
        protocol += `\nWELL LAYOUT:\n`;
        this.currentLayout.forEach(item => {
            protocol += `${item.well}: ${item.group} (${item.timepoint}, Bio${item.bioReplicate}, Tech${item.techReplicate})\n`;
        });

        const blob = new Blob([protocol], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${expName}_protocol.txt`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'Export Complete', 'Protocol file downloaded successfully');
    }

    updateStats() {
        // Update experiment counter
        let count = parseInt(localStorage.getItem('plateMasterExperiments') || '0');
        count++;
        localStorage.setItem('plateMasterExperiments', count.toString());
        document.getElementById('experiments-count').textContent = count;

        // Update wells counter
        let totalWells = parseInt(localStorage.getItem('plateMasterWells') || '0');
        totalWells += this.currentLayout.length;
        localStorage.setItem('plateMasterWells', totalWells.toString());
        document.getElementById('wells-count').textContent = totalWells;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    showNotification(type, title, message) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <div class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('plateMasterSettings') || '{}');
            return {
                labName: settings.labName || '',
                researcher: settings.researcher || '',
                defaultReplicates: settings.defaultReplicates || 3,
                colorScheme: settings.colorScheme || 'default',
                showWellLabels: settings.showWellLabels !== false
            };
        } catch {
            return {
                labName: '',
                researcher: '',
                defaultReplicates: 3,
                colorScheme: 'default',
                showWellLabels: true
            };
        }
    }

    saveSettings() {
        const settings = {
            labName: document.getElementById('lab-name')?.value || '',
            researcher: document.getElementById('researcher-name')?.value || '',
            defaultReplicates: parseInt(document.getElementById('default-replicates')?.value) || 3,
            colorScheme: document.getElementById('color-scheme')?.value || 'default',
            showWellLabels: document.getElementById('show-well-labels')?.checked !== false
        };

        localStorage.setItem('plateMasterSettings', JSON.stringify(settings));
        this.settings = settings;
        this.showNotification('success', 'Settings Saved', 'Your preferences have been updated');
    }
}

// Initialize the application
const app = new PlateMasterPro();

// Global helper functions for quick add buttons
window.addQuickGroups = function(type) {
    const groupSets = {
        'standard': ['Control', 'Vehicle', 'Treatment A', 'Treatment B'],
        'dose': ['0.1nM', '1nM', '10nM', '100nM', '1µM', '10µM', '100µM'],
        'bacterial': ['E. coli', 'S. aureus', 'P. aeruginosa', 'B. subtilis']
    };
    
    const groups = groupSets[type] || [];
    groups.forEach(group => {
        app.addTag(document.getElementById('groups-container'), group);
    });
    app.updateQuickStats();
};

window.addQuickTimepoints = function(type) {
    const timeSets = {
        'standard': ['0h', '24h', '48h'],
        'kinetic': ['0h', '30min', '1h', '2h', '4h', '8h', '24h'],
        'long': ['0h', '24h', '48h', '72h', '96h', '7d']
    };
    
    const timepoints = timeSets[type] || [];
    timepoints.forEach(timepoint => {
        app.addTag(document.getElementById('timepoints-container'), timepoint);
    });
    app.updateQuickStats();
};

window.exportPlate = function(format) {
    app.exportPlate(format);
};

// Load saved templates on page load
document.addEventListener('DOMContentLoaded', () => {
    app.loadSavedTemplates();
});

console.log('PlateMaster Pro initialized successfully with improved visualization!');
