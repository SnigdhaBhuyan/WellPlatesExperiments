/**
 * PlateMaster Pro - Enhanced JavaScript Application
 * Features: Scientific notation support, customizable parameters, PNG export with labels
 */

class PlateMasterPro {
    constructor() {
        // Enhanced plate configurations with customizable parameters
        this.plateConfigs = {
            "6": { 
                rows: 2, cols: 3, 
                rowLabels: ['A', 'B'],
                surfaceArea: 9.6, maxVolume: 3500, workingVolume: 2500
            },
            "12": { 
                rows: 3, cols: 4, 
                rowLabels: ['A', 'B', 'C'],
                surfaceArea: 3.8, maxVolume: 2200, workingVolume: 1500
            },
            "24": { 
                rows: 4, cols: 6, 
                rowLabels: ['A', 'B', 'C', 'D'],
                surfaceArea: 1.9, maxVolume: 1000, workingVolume: 750
            },
            "48": { 
                rows: 6, cols: 8, 
                rowLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
                surfaceArea: 0.75, maxVolume: 500, workingVolume: 350
            },
            "96": { 
                rows: 8, cols: 12, 
                rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
                surfaceArea: 0.32, maxVolume: 360, workingVolume: 200
            },
            "384": { 
                rows: 16, cols: 24, 
                rowLabels: Array.from({length: 16}, (_, i) => String.fromCharCode(65 + i)),
                surfaceArea: 0.087, maxVolume: 80, workingVolume: 50
            }
        };

        // Professional color schemes
        this.colorSchemes = {
            default: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c', '#0891b2', '#be185d'],
            colorblind: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'],
            highContrast: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        };

        // Application state
        this.currentLayout = [];
        this.currentColors = {};
        this.zoomLevel = 1;
        this.settings = this.loadSettings();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabSwitching();
        this.setupExpandableSection();
        this.loadDefaults();
        this.updatePlateParameters();
        this.drawEmptyPlate();
        this.showNotification('success', 'Welcome!', 'PlateMaster Pro is ready for scientific work');
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('generate-layout').addEventListener('click', () => this.generateLayout());
        document.getElementById('calculate-dilution').addEventListener('click', () => this.calculateDilution());
        document.getElementById('calculate-cfu').addEventListener('click', () => this.calculateCFU());
        document.getElementById('convert-units').addEventListener('click', () => this.convertUnits());

        // Tag inputs with Enter key support
        this.setupTagInput('group-input', 'groups-container');
        this.setupTagInput('timepoint-input', 'timepoints-container');

        // Plate controls
        document.getElementById('zoom-in').addEventListener('click', () => this.adjustZoom(1.2));
        document.getElementById('zoom-out').addEventListener('click', () => this.adjustZoom(0.8));
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());

        // Settings and customization
        document.getElementById('plate-format').addEventListener('change', () => this.updatePlateParameters());
        document.getElementById('reset-defaults').addEventListener('click', () => this.resetPlateDefaults());
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());

        // Real-time unit conversion
        ['convert-from', 'convert-from-unit', 'convert-to-unit'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.convertUnitsRealTime());
            }
        });

        // Display options
        document.getElementById('show-timepoints').addEventListener('change', (e) => {
            this.settings.showTimepoints = e.target.checked;
            this.drawPlate();
        });

        document.getElementById('show-replicates').addEventListener('change', (e) => {
            this.settings.showReplicates = e.target.checked;
            this.drawPlate();
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

    setupExpandableSection() {
        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.closest('.expandable-section');
                section.classList.toggle('open');
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

    // **ENHANCED SCIENTIFIC NOTATION PARSER**
    parseScientificInput(input) {
        if (!input || typeof input !== 'string') return NaN;
        
        // Clean and normalize input
        let cleanInput = input.trim()
            .replace(/×/g, '*')           // Replace × with *
            .replace(/\^/g, '**')         // Replace ^ with **
            .replace(/\s+/g, '')          // Remove all spaces
            .toLowerCase();

        try {
            // Handle common scientific notation formats
            if (cleanInput.includes('e')) {
                // Already in exponential format (1e6, 1.5e-3, etc.)
                return parseFloat(cleanInput);
            }
            
            // Handle power notation (3*10**6, 1.5*10**-3)
            if (cleanInput.includes('10**')) {
                const result = Function(`"use strict"; return (${cleanInput})`)();
                return typeof result === 'number' && isFinite(result) ? result : NaN;
            }
            
            // Handle simple numbers
            const simpleNumber = parseFloat(cleanInput);
            if (!isNaN(simpleNumber)) {
                return simpleNumber;
            }
            
            return NaN;
        } catch (error) {
            return NaN;
        }
    }

    generateLayout() {
        const groups = this.getTags('groups-container');
        const timepoints = this.getTags('timepoints-container');
        const bioReps = parseInt(document.getElementById('bio-replicates').value) || 3;
        const techReps = parseInt(document.getElementById('tech-replicates').value) || 3;
        const plateFormat = document.getElementById('plate-format').value;
        const includeControls = document.getElementById('include-controls').checked;
        const includeBlanks = document.getElementById('include-blanks').checked;
        const randomize = document.getElementById('randomize-layout').checked;

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

        // Add control wells if requested
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

        // Add blank wells if requested
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

        // Randomize if requested
        if (randomize) {
            this.randomizeLayout();
        }

        // Update display
        this.drawPlate();
        this.updateQuickStats();
        this.updatePlateTitle();

        this.showNotification('success', 'Layout Generated', 
            `Successfully created layout with ${this.currentLayout.length} wells`);
    }

    getWellName(index, config) {
        const row = config.rowLabels[Math.floor(index / config.cols)];
        const col = (index % config.cols) + 1;
        return `${row}${col}`;
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

    // **ENHANCED PLATE VISUALIZATION WITH BETTER PNG EXPORT SUPPORT**
    drawPlateStructure(config, layout) {
        const { rows, cols, rowLabels } = config;
        const container = document.getElementById('plate-container');
        
        // Clear container
        container.innerHTML = '';

        // Create main wrapper for plate and legend
        const mainWrapper = document.createElement('div');
        mainWrapper.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 2rem;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            border-radius: 12px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        `;

        // Create plate section
        const plateSection = document.createElement('div');
        plateSection.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
        `;

        // Create enhanced table with better labels for PNG export
        const table = document.createElement('table');
        table.style.cssText = `
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            font-family: 'Inter', sans-serif;
        `;

        // Enhanced header row
        const headerRow = document.createElement('tr');
        const cornerCell = document.createElement('th');
        cornerCell.style.cssText = `
            width: 40px;
            height: 30px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            font-weight: 600;
            color: #475569;
        `;
        headerRow.appendChild(cornerCell);

        // Column headers (1, 2, 3...)
        for (let c = 1; c <= cols; c++) {
            const th = document.createElement('th');
            th.textContent = c;
            th.style.cssText = `
                width: 35px;
                height: 30px;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                text-align: center;
                font-weight: 600;
                color: #475569;
                font-size: 0.9rem;
            `;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Data rows with enhanced well visualization
        for (let r = 0; r < rows; r++) {
            const row = document.createElement('tr');
            
            // Row header (A, B, C...)
            const rowHeader = document.createElement('th');
            rowHeader.textContent = rowLabels[r];
            rowHeader.style.cssText = `
                width: 40px;
                height: 35px;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                text-align: center;
                font-weight: 600;
                color: #475569;
                font-size: 0.9rem;
            `;
            row.appendChild(rowHeader);

            // Well cells
            for (let c = 0; c < cols; c++) {
                const wellName = `${rowLabels[r]}${c + 1}`;
                const wellData = layout.find(w => w.well === wellName);
                
                const cell = document.createElement('td');
                cell.style.cssText = `
                    width: 35px;
                    height: 35px;
                    border: 1px solid #cbd5e1;
                    padding: 2px;
                    text-align: center;
                    position: relative;
                `;

                // Create well circle
                const circle = document.createElement('div');
                circle.style.cssText = `
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    margin: auto;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                `;

                if (wellData) {
                    circle.style.backgroundColor = wellData.color;
                    circle.style.border = `2px solid ${this.darkenColor(wellData.color, 15)}`;
                    
                    // Add text overlay for timepoints/replicates if enabled
                    if (this.settings.showTimepoints || this.settings.showReplicates) {
                        const textOverlay = document.createElement('div');
                        textOverlay.style.cssText = `
                            position: absolute;
                            bottom: -20px;
                            left: 50%;
                            transform: translateX(-50%);
                            font-size: 0.6rem;
                            color: #374151;
                            font-weight: 600;
                            background: rgba(255, 255, 255, 0.9);
                            padding: 1px 3px;
                            border-radius: 3px;
                            white-space: nowrap;
                        `;
                        
                        let overlayText = '';
                        if (this.settings.showTimepoints) overlayText += wellData.timepoint;
                        if (this.settings.showReplicates) {
                            if (overlayText) overlayText += ' ';
                            overlayText += `B${wellData.bioReplicate}T${wellData.techReplicate}`;
                        }
                        textOverlay.textContent = overlayText;
                        cell.appendChild(textOverlay);
                    }

                    // Enhanced tooltip
                    circle.title = `Well ${wellName}\nGroup: ${wellData.group}\nTime: ${wellData.timepoint}\nBio Rep: ${wellData.bioReplicate}\nTech Rep: ${wellData.techReplicate}\nType: ${wellData.type}`;
                } else {
                    circle.style.backgroundColor = '#f8fafc';
                    circle.style.border = '2px solid #cbd5e1';
                    circle.title = `Well ${wellName}\nEmpty`;
                }

                // Enhanced hover effects
                circle.addEventListener('mouseenter', () => {
                    circle.style.transform = 'scale(1.1)';
                    circle.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                });

                circle.addEventListener('mouseleave', () => {
                    circle.style.transform = 'scale(1)';
                    circle.style.boxShadow = 'none';
                });

                cell.appendChild(circle);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        plateSection.appendChild(table);

        // Add plate information for PNG export
        const plateInfo = document.createElement('div');
        plateInfo.style.cssText = `
            margin-top: 1rem;
            text-align: center;
            font-size: 0.9rem;
            color: #64748b;
            font-weight: 500;
        `;
        
        const expName = document.getElementById('exp-name').value || 'Untitled Experiment';
        const researcher = document.getElementById('researcher-name').value || 'Unknown Researcher';
        
        plateInfo.innerHTML = `
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">${expName}</div>
            <div>Researcher: ${researcher}</div>
            <div>${config.rows}×${config.cols} plate (${rows * cols} wells)</div>
            <div>${config.surfaceArea} cm² per well</div>
            <div style="font-size: 0.8rem; margin-top: 0.5rem;">Generated: ${new Date().toLocaleDateString()}</div>
        `;
        plateSection.appendChild(plateInfo);

        // Create enhanced legend
        const legendSection = this.createEnhancedLegend(layout);

        mainWrapper.appendChild(plateSection);
        mainWrapper.appendChild(legendSection);
        container.appendChild(mainWrapper);

        // Apply zoom
        container.style.transform = `scale(${this.zoomLevel})`;
    }

    createEnhancedLegend(layout) {
        const legendSection = document.createElement('div');
        legendSection.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            min-width: 200px;
            max-width: 250px;
        `;

        const legendTitle = document.createElement('h3');
        legendTitle.textContent = 'Group Legend';
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
        
        const legendIcon = document.createElement('i');
        legendIcon.className = 'fas fa-palette';
        legendIcon.style.color = '#3b82f6';
        legendTitle.insertBefore(legendIcon, legendTitle.firstChild);
        
        legendSection.appendChild(legendTitle);

        if (layout.length > 0) {
            const uniqueGroups = [...new Set(layout.map(item => item.group))];
            
            uniqueGroups.forEach(group => {
                const item = document.createElement('div');
                item.style.cssText = `
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

                const colorSquare = document.createElement('div');
                colorSquare.style.cssText = `
                    width: 16px;
                    height: 16px;
                    border-radius: 3px;
                    background-color: ${this.currentColors[group]};
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    flex-shrink: 0;
                `;

                const groupInfo = document.createElement('div');
                groupInfo.style.cssText = 'flex: 1;';

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
                const wellType = groupWells[0]?.type || 'experimental';
                
                groupDetails.innerHTML = `${wellCount} wells • ${wellType}`;

                groupInfo.appendChild(groupName);
                groupInfo.appendChild(groupDetails);
                item.appendChild(colorSquare);
                item.appendChild(groupInfo);
                legendSection.appendChild(item);
            });

            // Add summary information
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
                <div><strong>Utilization:</strong> ${((layout.length / (this.plateConfigs[document.getElementById('plate-format').value].rows * this.plateConfigs[document.getElementById('plate-format').value].cols)) * 100).toFixed(1)}%</div>
            `;
            legendSection.appendChild(summaryDiv);
        } else {
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
            legendSection.appendChild(emptyState);
        }

        return legendSection;
    }

    // **ENHANCED SCIENTIFIC CALCULATOR**
    calculateDilution() {
        const stockConcInput = document.getElementById('stock-conc').value;
        const stockUnit = document.getElementById('stock-unit').value;
        const targetConcInput = document.getElementById('target-conc').value;
        const targetUnit = document.getElementById('target-unit').value;
        const finalVolInput = document.getElementById('final-volume').value;
        const volUnit = document.getElementById('volume-unit').value;

        // Parse scientific notation inputs
        const stockConc = this.parseScientificInput(stockConcInput);
        const targetConc = this.parseScientificInput(targetConcInput);
        const finalVol = this.parseScientificInput(finalVolInput);

        if (isNaN(stockConc) || isNaN(targetConc) || isNaN(finalVol)) {
            this.showNotification('error', 'Invalid Input', 'Please enter valid numbers (supports scientific notation like 3×10⁶)');
            return;
        }

        if (stockConc <= 0 || targetConc <= 0 || finalVol <= 0) {
            this.showNotification('error', 'Invalid Values', 'All values must be positive');
            return;
        }

        // Convert to common units
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

        // Generate multiple batch sizes
        const batchSizes = [1, 2, 5, 10, 25, 50];
        const batches = batchSizes.map(multiplier => ({
            size: multiplier,
            stockVol: (volStock * multiplier).toFixed(3),
            diluentVol: (volDiluent * multiplier).toFixed(3),
            totalVol: (finalVolBase * multiplier).toFixed(3)
        }));

        const resultDiv = document.getElementById('dilution-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-flask"></i> Dilution Protocol</h4>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p><strong>Stock volume needed:</strong> ${volStock.toFixed(3)} µL</p>
                <p><strong>Diluent volume:</strong> ${volDiluent.toFixed(3)} µL</p>
                <p><strong>Final volume:</strong> ${finalVolBase.toFixed(1)} µL</p>
                <p><strong>Dilution factor:</strong> ${dilutionFactor.toExponential(2)}</p>
            </div>
            
            <div style="margin-top: 15px;">
                <h5><i class="fas fa-table"></i> Batch Preparation Guide</h5>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem;">
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Batch</th>
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

    calculateCFU() {
        const stockCFUInput = document.getElementById('cfu-stock').value;
        const stockUnit = document.getElementById('cfu-stock-unit').value;
        const targetCFUInput = document.getElementById('target-cfu').value;
        const targetUnit = document.getElementById('target-cfu-unit').value;
        const wellVolume = parseFloat(document.getElementById('well-volume').value);
        const wellCount = parseInt(document.getElementById('well-count').value);

        // Parse scientific notation
        const stockCFU = this.parseScientificInput(stockCFUInput);
        const targetCFU = this.parseScientificInput(targetCFUInput);

        if (isNaN(stockCFU) || isNaN(targetCFU) || isNaN(wellVolume) || isNaN(wellCount)) {
            this.showNotification('error', 'Invalid Input', 'Please enter valid numbers for all CFU fields');
            return;
        }

        // Convert CFU to common unit (CFU/mL)
        let stockCFUBase = stockCFU;
        let targetCFUBase = targetCFU;

        if (stockUnit === 'CFU/µL') stockCFUBase *= 1000;
        if (targetUnit === 'CFU/µL') targetCFUBase *= 1000;
        if (targetUnit === 'CFU/well') {
            targetCFUBase = targetCFU / (wellVolume / 1000); // Convert to CFU/mL
        }
        if (targetUnit === 'CFU/cm²') {
            const plateFormat = document.getElementById('plate-format').value;
            const surfaceArea = this.plateConfigs[plateFormat].surfaceArea;
            targetCFUBase = targetCFU * surfaceArea * (wellVolume / 1000); // Convert to CFU/mL
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
        const plateFormat = document.getElementById('plate-format').value;
        const surfaceArea = this.plateConfigs[plateFormat].surfaceArea;
        const cfuPerCm2 = targetCFUBase * (wellVolume / 1000) / surfaceArea;
        const totalSurfaceArea = surfaceArea * wellCount;

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
            </div>
        `;
        resultDiv.classList.add('show');
    }

    convertConcentrationToBase(value, unit) {
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
        
        return value; // Default if unit not found
    }

    convertVolumeToMicroliters(value, unit) {
        const conversions = {
            'L': 1e6, 'mL': 1e3, 'µL': 1
        };
        return value * (conversions[unit] || 1e3); // Default to mL
    }

    convertUnits() {
        const value = this.parseScientificInput(document.getElementById('convert-from').value);
        const fromUnit = document.getElementById('convert-from-unit').value;
        const toUnit = document.getElementById('convert-to-unit').value;

        if (isNaN(value)) {
            this.showNotification('warning', 'Input Error', 'Please enter a valid number');
            return;
        }

        let result = value;

        // Enhanced conversion factors
        const conversions = {
            // Volume
            'L_mL': 1000, 'mL_L': 0.001, 'mL_µL': 1000, 'µL_mL': 0.001,
            'µL_nL': 1000, 'nL_µL': 0.001, 'nL_pL': 1000, 'pL_nL': 0.001,
            
            // Mass
            'kg_g': 1000, 'g_kg': 0.001, 'g_mg': 1000, 'mg_g': 0.001,
            'mg_µg': 1000, 'µg_mg': 0.001, 'µg_ng': 1000, 'ng_µg': 0.001,
            'ng_pg': 1000, 'pg_ng': 0.001,
            
            // Molar
            'mol_mmol': 1000, 'mmol_mol': 0.001, 'mmol_µmol': 1000, 'µmol_mmol': 0.001,
            'µmol_nmol': 1000, 'nmol_µmol': 0.001, 'nmol_pmol': 1000, 'pmol_nmol': 0.001
        };

        const conversionKey = `${fromUnit}_${toUnit}`;

        if (fromUnit === toUnit) {
            result = value;
        } else if (conversions[conversionKey]) {
            result = value * conversions[conversionKey];
        } else {
            this.showNotification('error', 'Conversion Error', `Cannot convert from ${fromUnit} to ${toUnit}`);
            return;
        }

        document.getElementById('convert-result').value = this.formatScientificResult(result);
    }

    convertUnitsRealTime() {
        const value = document.getElementById('convert-from').value;
        if (value && !isNaN(this.parseScientificInput(value))) {
            this.convertUnits();
        } else {
            document.getElementById('convert-result').value = '';
        }
    }

    formatScientificResult(number) {
        if (Math.abs(number) >= 1e6 || (Math.abs(number) < 1e-3 && number !== 0)) {
            return number.toExponential(3);
        } else {
            return number.toPrecision(6);
        }
    }

    // **ENHANCED PNG EXPORT WITH PROPER LABELING**
    async exportPlate(format) {
        if (this.currentLayout.length === 0) {
            this.showNotification('warning', 'No Layout', 'Please generate a plate layout first');
            return;
        }

        this.showLoading('Exporting...');

        try {
            switch (format) {
                case 'png':
                    await this.exportAsPNG();
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
        } catch (error) {
            this.showNotification('error', 'Export Failed', error.message);
        } finally {
            this.hideLoading();
        }
    }

    async exportAsPNG() {
        // Create a high-resolution version of the plate for export
        const exportContainer = document.createElement('div');
        exportContainer.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            background: white;
            padding: 40px;
            font-family: 'Inter', sans-serif;
        `;

        // Clone and enhance the current plate visualization
        const plateClone = document.getElementById('plate-container').cloneNode(true);
        plateClone.style.transform = 'scale(2)'; // Higher resolution
        plateClone.style.transformOrigin = 'top left';

        // Add header information
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border-bottom: 2px solid #e2e8f0;
        `;
        
        const expName = document.getElementById('exp-name').value || 'Untitled Experiment';
        const researcher = document.getElementById('researcher-name').value || 'Unknown Researcher';
        const date = new Date().toLocaleDateString();
        
        header.innerHTML = `
            <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">${expName}</h1>
            <p style="font-size: 16px; color: #475569;">Researcher: ${researcher}</p>
            <p style="font-size: 14px; color: #64748b;">Generated: ${date} | PlateMaster Pro</p>
        `;

        exportContainer.appendChild(header);
        exportContainer.appendChild(plateClone);
        document.body.appendChild(exportContainer);

        try {
            // Use html2canvas if available, otherwise provide fallback
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(exportContainer, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    allowTaint: false
                });
                
                // Download the image
                const link = document.createElement('a');
                link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_plate_layout.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                this.showNotification('success', 'Export Complete', 'High-quality PNG downloaded successfully');
            } else {
                // Fallback: Show instructions for manual screenshot
                this.showNotification('info', 'Screenshot Tip', 'Take a screenshot of the plate for high-quality export');
            }
        } finally {
            document.body.removeChild(exportContainer);
        }
    }

    exportAsSVG() {
        const svg = document.querySelector('#plate-container svg');
        if (!svg) {
            this.showNotification('error', 'Export Error', 'No SVG visualization found');
            return;
        }

        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        const expName = document.getElementById('exp-name').value || 'plate-layout';
        link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}.svg`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'Export Complete', 'SVG file downloaded successfully');
    }

    exportAsCSV() {
        let csv = 'Well,Group,Timepoint,BioReplicate,TechReplicate,Type,Color\n';
        
        this.currentLayout.forEach(item => {
            csv += `"${item.well}","${item.group}","${item.timepoint}","${item.bioReplicate}","${item.techReplicate}","${item.type}","${item.color}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        const expName = document.getElementById('exp-name').value || 'plate-layout';
        link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_data.csv`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'Export Complete', 'CSV data file downloaded successfully');
    }

    exportAsProtocol() {
        const expName = document.getElementById('exp-name').value || 'Untitled Experiment';
        const researcher = document.getElementById('researcher-name').value || 'Unknown Researcher';
        const plateFormat = document.getElementById('plate-format').value;
        const groups = [...new Set(this.currentLayout.map(item => item.group))];
        
        let protocol = `EXPERIMENTAL PROTOCOL\n`;
        protocol += `====================\n\n`;
        protocol += `Experiment: ${expName}\n`;
        protocol += `Researcher: ${researcher}\n`;
        protocol += `Date: ${new Date().toLocaleDateString()}\n`;
        protocol += `Plate Format: ${plateFormat}-well\n`;
        protocol += `Wells Used: ${this.currentLayout.length}\n\n`;
        
        protocol += `EXPERIMENTAL GROUPS:\n`;
        protocol += `===================\n`;
        groups.forEach((group, index) => {
            const groupWells = this.currentLayout.filter(item => item.group === group);
            protocol += `${index + 1}. ${group} (${groupWells.length} wells)\n`;
        });
        
        protocol += `\nWELL ASSIGNMENTS:\n`;
        protocol += `================\n`;
        this.currentLayout.forEach(item => {
            protocol += `${item.well}: ${item.group} | ${item.timepoint} | Bio${item.bioReplicate} | Tech${item.techReplicate}\n`;
        });

        protocol += `\nGENERATED BY: PlateMaster Pro\n`;
        protocol += `TIMESTAMP: ${new Date().toISOString()}\n`;

        const blob = new Blob([protocol], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_protocol.txt`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'Export Complete', 'Protocol file downloaded successfully');
    }

    // Utility methods
    updatePlateParameters() {
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        
        if (document.getElementById('well-surface-area')) {
            document.getElementById('well-surface-area').value = config.surfaceArea;
        }
        if (document.getElementById('well-max-volume')) {
            document.getElementById('well-max-volume').value = config.maxVolume;
        }
        if (document.getElementById('well-working-volume')) {
            document.getElementById('well-working-volume').value = config.workingVolume;
        }
        
        this.updateQuickStats();
        this.drawEmptyPlate();
    }

    resetPlateDefaults() {
        this.updatePlateParameters();
        this.showNotification('info', 'Reset Complete', 'Plate parameters reset to defaults');
    }

    updateQuickStats() {
        const groups = this.getTags('groups-container');
        const timepoints = this.getTags('timepoints-container');
        const bioReps = parseInt(document.getElementById('bio-replicates').value) || 0;
        const techReps = parseInt(document.getElementById('tech-replicates').value) || 0;
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];

        const wellsNeeded = groups.length * timepoints.length * bioReps * techReps;
        const wellsAvailable = config.rows * config.cols;
        const utilization = wellsAvailable > 0 ? (wellsNeeded / wellsAvailable * 100).toFixed(1) : 0;
        const totalSurface = (wellsNeeded * config.surfaceArea).toFixed(2);

        document.getElementById('wells-needed').textContent = wellsNeeded;
        document.getElementById('wells-available').textContent = wellsAvailable;
        document.getElementById('utilization').textContent = `${utilization}%`;
        document.getElementById('total-surface').textContent = totalSurface;
    }

    updatePlateTitle() {
        const expName = document.getElementById('exp-name').value || 'Plate Layout';
        document.getElementById('plate-title').textContent = expName;
    }

    adjustZoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
        
        const container = document.getElementById('plate-container');
        container.style.transform = `scale(${this.zoomLevel})`;
        container.style.transformOrigin = 'center center';
    }

    toggleFullscreen() {
        const container = document.getElementById('plate-container');
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                this.showNotification('error', 'Fullscreen Error', 'Could not enter fullscreen mode');
            });
        } else {
            document.exitFullscreen();
        }
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

    showLoading(message = 'Processing...') {
        const loading = document.getElementById('loading');
        loading.querySelector('p').textContent = message;
        loading.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    loadDefaults() {
        // Load saved settings or use defaults
        document.getElementById('plate-format').value = '96';
        document.getElementById('bio-replicates').value = this.settings.defaultBioReps || 3;
        document.getElementById('tech-replicates').value = this.settings.defaultTechReps || 3;
        
        if (this.settings.defaultResearcher) {
            document.getElementById('researcher-name').value = this.settings.defaultResearcher;
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('plateMasterSettings') || '{}');
            return {
                colorScheme: settings.colorScheme || 'default',
                showTimepoints: settings.showTimepoints || false,
                showReplicates: settings.showReplicates || false,
                defaultBioReps: settings.defaultBioReps || 3,
                defaultTechReps: settings.defaultTechReps || 3,
                defaultResearcher: settings.defaultResearcher || '',
                exportQuality: settings.exportQuality || 'high'
            };
        } catch {
            return {
                colorScheme: 'default',
                showTimepoints: false,
                showReplicates: false,
                defaultBioReps: 3,
                defaultTechReps: 3,
                defaultResearcher: '',
                exportQuality: 'high'
            };
        }
    }

    saveSettings() {
        const settings = {
            colorScheme: document.getElementById('color-scheme')?.value || 'default',
            showTimepoints: document.getElementById('show-timepoints')?.checked || false,
            showReplicates: document.getElementById('show-replicates')?.checked || false,
            defaultBioReps: parseInt(document.getElementById('default-bio-reps')?.value) || 3,
            defaultTechReps: parseInt(document.getElementById('default-tech-reps')?.value) || 3,
            defaultResearcher: document.getElementById('default-researcher')?.value || '',
            exportQuality: document.getElementById('export-quality')?.value || 'high'
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

// Load external libraries for enhanced PNG export
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
script.async = true;
document.head.appendChild(script);

console.log('🧪 PlateMaster Pro loaded successfully with enhanced features!');
