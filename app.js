/**
 * PlateMaster Pro - Ultimate Laboratory Design Tool
 * Advanced JavaScript with CFU calculations and beautiful plate visualization
 */

class PlateMasterPro {
    constructor() {
        // Enhanced plate configurations with real laboratory data
        this.plateConfigs = {
            "6": { 
                rows: 2, cols: 3, 
                rowLabels: ['A', 'B'],
                surfaceArea: 9.6, maxVolume: 3500, workingVolume: 2500,
                description: "6-well plates for cell culture"
            },
            "12": { 
                rows: 3, cols: 4, 
                rowLabels: ['A', 'B', 'C'],
                surfaceArea: 3.8, maxVolume: 2200, workingVolume: 1500,
                description: "12-well plates for medium-scale assays"
            },
            "24": { 
                rows: 4, cols: 6, 
                rowLabels: ['A', 'B', 'C', 'D'],
                surfaceArea: 1.9, maxVolume: 1000, workingVolume: 750,
                description: "24-well plates for bacterial studies"
            },
            "48": { 
                rows: 6, cols: 8, 
                rowLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
                surfaceArea: 0.75, maxVolume: 500, workingVolume: 350,
                description: "48-well plates for high-throughput"
            },
            "96": { 
                rows: 8, cols: 12, 
                rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
                surfaceArea: 0.32, maxVolume: 360, workingVolume: 200,
                description: "96-well plates for standard assays"
            },
            "384": { 
                rows: 16, cols: 24, 
                rowLabels: Array.from({length: 16}, (_, i) => String.fromCharCode(65 + i)),
                surfaceArea: 0.087, maxVolume: 80, workingVolume: 50,
                description: "384-well plates for ultra-high throughput"
            }
        };

        // Professional color schemes for different assay types
        this.colorSchemes = {
            bacterial: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#ef4444', '#0891b2', '#be185d'],
            cell: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
            antimicrobial: ['#1e40af', '#7f1d1d', '#166534', '#92400e', '#581c87', '#155e75', '#365314', '#9a3412'],
            default: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c', '#0891b2', '#be185d']
        };

        // Application state
        this.currentLayout = [];
        this.currentColors = {};
        this.zoomLevel = 1;
        this.settings = this.loadSettings();
        this.statistics = { experiments: 0, wells: 0 };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabSwitching();
        this.setupExpandableSection();
        this.loadStatistics();
        this.updatePlateParameters();
        this.drawEmptyPlate();
        this.showWelcomeNotification();
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('generate-layout').addEventListener('click', () => this.generateLayout());
        document.getElementById('calculate-cfu').addEventListener('click', () => this.calculateAdvancedCFU());
        document.getElementById('calculate-dilution').addEventListener('click', () => this.calculateDilution());
        document.getElementById('calculate-serial').addEventListener('click', () => this.calculateSerialDilution());
        document.getElementById('calculate-colonies').addEventListener('click', () => this.calculateColonies());

        // Tag input systems
        this.setupTagInput('group-input', 'groups-container');
        this.setupTagInput('timepoint-input', 'timepoints-container');

        // Plate controls
        document.getElementById('zoom-in').addEventListener('click', () => this.adjustZoom(1.2));
        document.getElementById('zoom-out').addEventListener('click', () => this.adjustZoom(0.8));
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

        // Settings and parameters
        document.getElementById('plate-format').addEventListener('change', () => this.updatePlateParameters());
        document.getElementById('assay-type').addEventListener('change', () => this.updateColorScheme());
        document.getElementById('reset-plate-defaults').addEventListener('click', () => this.resetPlateDefaults());

        // Real-time updates
        ['bio-replicates', 'tech-replicates'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateStatistics());
        });

        // Scientific notation helpers
        this.setupScientificNotationHelpers();
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.nav-tab');
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
                
                // Load specific tab data
                this.handleTabSwitch(targetTab);
            });
        });
    }

    setupExpandableSection() {
        document.querySelectorAll('.expand-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.expandable-section');
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
                this.updateStatistics();
            }
        });

        // Add paste support for multiple values
        input.addEventListener('paste', (e) => {
            setTimeout(() => {
                const values = input.value.split(/[,;\n\t]/).map(v => v.trim()).filter(v => v);
                if (values.length > 1) {
                    input.value = '';
                    values.forEach(value => this.addTag(container, value));
                    this.updateStatistics();
                }
            }, 10);
        });
    }

    setupScientificNotationHelpers() {
        // Add scientific notation format helpers
        document.querySelectorAll('.scientific-input').forEach(input => {
            // Add format examples on focus
            input.addEventListener('focus', () => {
                if (!input.value) {
                    input.placeholder = 'e.g., 1×10⁶, 1e6, 1000000';
                }
            });

            // Validate and format on blur
            input.addEventListener('blur', () => {
                const value = this.parseScientificInput(input.value);
                if (!isNaN(value) && value > 0) {
                    input.style.borderColor = '#10b981';
                    input.style.backgroundColor = '#f0fdf4';
                } else if (input.value) {
                    input.style.borderColor = '#ef4444';
                    input.style.backgroundColor = '#fef2f2';
                } else {
                    input.style.borderColor = '';
                    input.style.backgroundColor = '';
                }
            });
        });
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

    formatScientificOutput(number) {
        if (isNaN(number)) return 'Invalid';
        
        if (Math.abs(number) >= 1e6 || (Math.abs(number) < 1e-3 && number !== 0)) {
            return number.toExponential(2);
        } else if (Math.abs(number) >= 1000) {
            return number.toLocaleString();
        } else {
            return number.toPrecision(4);
        }
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
            <span class="tag-remove" onclick="this.parentElement.remove(); app.updateStatistics();">×</span>
        `;
        
        const input = container.querySelector('.tag-input');
        container.insertBefore(tag, input);
    }

    getTags(containerId) {
        const container = document.getElementById(containerId);
        return Array.from(container.querySelectorAll('.tag span:first-child')).map(span => span.textContent);
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

        // Enhanced validation
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

        // Add control wells calculation
        if (includeControls) {
            totalWells += timepoints.length * bioReps * techReps * 2; // Positive and negative
        }

        if (includeBlanks) {
            totalWells += timepoints.length * techReps; // Blanks
        }

        const availableWells = config.rows * config.cols;

        if (totalWells > availableWells) {
            this.showNotification('error', 'Insufficient Wells', 
                `Design requires ${totalWells} wells but only ${availableWells} available. Consider reducing replicates or using a larger plate format.`);
            return;
        }

        // Show loading
        this.showLoading('Generating layout...');

        // Generate layout with delay for smooth UX
        setTimeout(() => {
            this.generatePlateLayout(groups, timepoints, bioReps, techReps, config, includeControls, includeBlanks, randomize);
            this.hideLoading();
        }, 500);
    }

    generatePlateLayout(groups, timepoints, bioReps, techReps, config, includeControls, includeBlanks, randomize) {
        this.currentLayout = [];
        let wellIndex = 0;

        // Get color scheme based on assay type
        const assayType = document.getElementById('assay-type').value;
        const colors = this.colorSchemes[assayType] || this.colorSchemes.default;
        this.currentColors = {};

        // Add experimental wells
        groups.forEach((group, groupIndex) => {
            this.currentColors[group] = colors[groupIndex % colors.length];
            
            timepoints.forEach(timepoint => {
                for (let b = 1; b <= bioReps; b++) {
                    for (let t = 1; t <= techReps; t++) {
                        if (wellIndex < config.rows * config.cols) {
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
                        if (wellIndex < config.rows * config.cols) {
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
                        if (wellIndex < config.rows * config.cols) {
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
                    if (wellIndex < config.rows * config.cols) {
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

        // Update displays
        this.drawPlate();
        this.updateStatistics();
        this.updatePlateTitle();
        this.updateGlobalStatistics();

        this.showNotification('success', 'Layout Generated Successfully!', 
            `Created layout with ${this.currentLayout.length} wells across ${groups.length} groups`);
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
        this.drawPlateVisualization(config, []);
    }

    drawPlate() {
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        this.drawPlateVisualization(config, this.currentLayout);
    }

    // **ULTIMATE PLATE VISUALIZATION**
    drawPlateVisualization(config, layout) {
        const { rows, cols, rowLabels } = config;
        const container = document.getElementById('plate-display');
        
        // Clear container
        container.innerHTML = '';

        if (layout.length === 0) {
            this.showEmptyPlateState(container, config);
            return;
        }

        // Create main visualization container
        const visualContainer = document.createElement('div');
        visualContainer.style.cssText = `
            display: flex;
            gap: 2rem;
            align-items: flex-start;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            border-radius: 16px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        `;

        // Create plate section
        const plateSection = this.createPlateTable(config, layout);
        
        // Create legend section
        const legendSection = this.createLegendPanel(layout, config);

        visualContainer.appendChild(plateSection);
        visualContainer.appendChild(legendSection);
        container.appendChild(visualContainer);

        // Apply zoom
        container.style.transform = `scale(${this.zoomLevel})`;
        container.style.transformOrigin = 'center top';
    }

    createPlateTable(config, layout) {
        const { rows, cols, rowLabels } = config;
        
        const plateSection = document.createElement('div');
        plateSection.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
        `;

        // Create enhanced table
        const table = document.createElement('table');
        table.className = 'plate-table';
        table.style.cssText = `
            border-collapse: collapse;
            border: 3px solid #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            background: #ffffff;
            font-family: 'Inter', sans-serif;
        `;

        // Header row with column numbers
        const headerRow = document.createElement('tr');
        const cornerCell = document.createElement('th');
        cornerCell.style.cssText = `
            width: 50px;
            height: 40px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            border: 1px solid #1e293b;
            font-weight: 700;
            font-size: 14px;
        `;
        headerRow.appendChild(cornerCell);

        for (let c = 1; c <= cols; c++) {
            const th = document.createElement('th');
            th.textContent = c;
            th.style.cssText = `
                width: 45px;
                height: 40px;
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                border: 1px solid #1e293b;
                text-align: center;
                font-weight: 700;
                font-size: 14px;
            `;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Data rows with enhanced wells
        for (let r = 0; r < rows; r++) {
            const row = document.createElement('tr');
            
            // Row header
            const rowHeader = document.createElement('th');
            rowHeader.textContent = rowLabels[r];
            rowHeader.style.cssText = `
                width: 50px;
                height: 45px;
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                border: 1px solid #1e293b;
                text-align: center;
                font-weight: 700;
                font-size: 14px;
            `;
            row.appendChild(rowHeader);

            // Well cells
            for (let c = 0; c < cols; c++) {
                const wellName = `${rowLabels[r]}${c + 1}`;
                const wellData = layout.find(w => w.well === wellName);
                
                const cell = document.createElement('td');
                cell.style.cssText = `
                    width: 45px;
                    height: 45px;
                    border: 1px solid #cbd5e1;
                    padding: 2px;
                    text-align: center;
                    position: relative;
                    background: #f8fafc;
                `;

                const wellCircle = this.createWellCircle(wellData, wellName);
                cell.appendChild(wellCircle);

                // Add labels if well has data
                if (wellData && document.getElementById('show-labels').checked) {
                    const replicateLabel = document.createElement('div');
                    replicateLabel.className = 'replicate-label';
                    replicateLabel.textContent = `B${wellData.bioReplicate}T${wellData.techReplicate}`;
                    cell.appendChild(replicateLabel);
                }

                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        plateSection.appendChild(table);

        // Add plate information
        const plateInfo = this.createPlateInfo(config, layout);
        plateSection.appendChild(plateInfo);

        return plateSection;
    }

    createWellCircle(wellData, wellName) {
        const circle = document.createElement('div');
        circle.className = 'well-circle';
        
        if (wellData) {
            circle.style.backgroundColor = wellData.color;
            circle.style.border = `2px solid ${this.darkenColor(wellData.color, 20)}`;
            
            // Add timepoint label inside well
            if (wellData.timepoint) {
                const timeLabel = document.createElement('div');
                timeLabel.className = 'well-label';
                timeLabel.textContent = wellData.timepoint;
                circle.appendChild(timeLabel);
            }

            // Enhanced tooltip
            circle.title = `${wellName}: ${wellData.group}\nTime: ${wellData.timepoint}\nBio Rep: ${wellData.bioReplicate}\nTech Rep: ${wellData.techReplicate}\nType: ${wellData.type}`;
            
            // Special styling for different types
            if (wellData.type === 'control') {
                circle.style.borderStyle = 'dashed';
                circle.style.borderWidth = '3px';
            } else if (wellData.type === 'blank') {
                circle.style.borderStyle = 'dotted';
                circle.style.borderWidth = '2px';
            }
        } else {
            circle.style.backgroundColor = '#e2e8f0';
            circle.style.border = '2px solid #cbd5e1';
            circle.title = `${wellName}: Empty well`;
        }

        // Enhanced hover effects
        circle.addEventListener('mouseenter', () => {
            circle.style.transform = 'scale(1.15)';
            circle.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            circle.style.zIndex = '10';
        });

        circle.addEventListener('mouseleave', () => {
            circle.style.transform = 'scale(1)';
            circle.style.boxShadow = '';
            circle.style.zIndex = '1';
        });

        return circle;
    }

    createLegendPanel(layout, config) {
        const legendSection = document.createElement('div');
        legendSection.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 2px solid #e2e8f0;
            min-width: 280px;
            max-width: 320px;
        `;

        const legendTitle = document.createElement('h3');
        legendTitle.innerHTML = '<i class="fas fa-palette" style="color: #3b82f6; margin-right: 0.5rem;"></i>Group Legend';
        legendTitle.style.cssText = `
            margin: 0 0 1.5rem 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: #1e293b;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        `;
        legendSection.appendChild(legendTitle);

        if (layout.length > 0) {
            const uniqueGroups = [...new Set(layout.map(item => item.group))];
            
            uniqueGroups.forEach(group => {
                const item = this.createLegendItem(group, layout);
                legendSection.appendChild(item);
            });

            // Add summary statistics
            const summary = this.createLegendSummary(layout, config);
            legendSection.appendChild(summary);
        } else {
            const emptyState = document.createElement('div');
            emptyState.style.cssText = `
                text-align: center;
                color: #94a3b8;
                font-style: italic;
                padding: 2rem;
            `;
            emptyState.innerHTML = `
                <i class="fas fa-flask" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5; display: block;"></i>
                <div>Generate a layout to see the legend</div>
            `;
            legendSection.appendChild(emptyState);
        }

        return legendSection;
    }

    createLegendItem(group, layout) {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #f1f5f9;
            transition: all 0.2s ease;
        `;

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

        const groupInfo = document.createElement('div');
        groupInfo.style.cssText = 'flex: 1;';

        const groupName = document.createElement('div');
        groupName.style.cssText = `
            font-weight: 600;
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

        // Hover effects
        item.addEventListener('mouseenter', () => {
            item.style.background = '#e2e8f0';
            item.style.transform = 'translateX(3px)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.background = '#f8fafc';
            item.style.transform = 'translateX(0)';
        });

        return item;
    }

    createLegendSummary(layout, config) {
        const summaryDiv = document.createElement('div');
        summaryDiv.style.cssText = `
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 2px solid #e2e8f0;
            font-size: 0.8rem;
            color: #64748b;
        `;
        
        const uniqueGroups = [...new Set(layout.map(item => item.group))];
        const utilization = ((layout.length / (config.rows * config.cols)) * 100).toFixed(1);
        
        summaryDiv.innerHTML = `
            <div style="margin-bottom: 0.5rem;"><strong>Total Groups:</strong> ${uniqueGroups.length}</div>
            <div style="margin-bottom: 0.5rem;"><strong>Wells Used:</strong> ${layout.length}</div>
            <div style="margin-bottom: 0.5rem;"><strong>Utilization:</strong> ${utilization}%</div>
            <div><strong>Surface Area:</strong> ${(layout.length * config.surfaceArea).toFixed(2)} cm²</div>
        `;
        
        return summaryDiv;
    }

    createPlateInfo(config, layout) {
        const plateInfo = document.createElement('div');
        plateInfo.style.cssText = `
            margin-top: 1.5rem;
            text-align: center;
            font-size: 0.9rem;
            color: #64748b;
            line-height: 1.5;
        `;
        
        const expName = document.getElementById('experiment-name').value || 'Untitled Experiment';
        const researcher = document.getElementById('researcher-name').value || 'Unknown Researcher';
        
        plateInfo.innerHTML = `
            <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem; margin-bottom: 0.5rem;">${expName}</div>
            <div style="margin-bottom: 0.25rem;">Researcher: ${researcher}</div>
            <div style="margin-bottom: 0.25rem;">${config.rows}×${config.cols} plate (${config.rows * config.cols} wells)</div>
            <div style="margin-bottom: 0.25rem;">Surface area: ${config.surfaceArea} cm² per well</div>
            <div style="font-size: 0.8rem; margin-top: 0.5rem; color: #94a3b8;">Generated: ${new Date().toLocaleDateString()} • PlateMaster Pro</div>
        `;
        
        return plateInfo;
    }

    showEmptyPlateState(container, config) {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            padding: 3rem;
            text-align: center;
            color: #64748b;
        `;

        emptyState.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;">
                <i class="fas fa-th"></i>
            </div>
            <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">
                Ready to Design Your ${config.rows}×${config.cols} Plate
            </h3>
            <p style="font-size: 1rem; line-height: 1.6; max-width: 400px; margin-bottom: 2rem;">
                Add your treatment groups and timepoints, then click "Generate Plate Layout" to create your experimental design.
            </p>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; border: 1px solid #bae6fd;">
                <strong>Plate Specifications:</strong><br>
                Surface Area: ${config.surfaceArea} cm² per well<br>
                Working Volume: ${config.workingVolume} µL<br>
                ${config.description}
            </div>
        `;

        container.appendChild(emptyState);
    }

    // **ADVANCED CFU CALCULATOR** - Based on your handwritten notes
    calculateAdvancedCFU() {
        const stockConcInput = document.getElementById('stock-concentration').value;
        const stockUnit = document.getElementById('stock-unit').value;
        const targetConcInput = document.getElementById('target-concentration').value;
        const targetUnit = document.getElementById('target-unit').value;
        const totalVolumeInput = document.getElementById('total-volume').value;
        const volumeUnit = document.getElementById('volume-unit').value;
        const wellSurface = parseFloat(document.getElementById('well-surface').value) || 0.32;
        const mediaVolume = parseFloat(document.getElementById('media-volume').value) || 200;

        // Parse scientific notation inputs
        const stockConc = this.parseScientificInput(stockConcInput);
        const targetConc = this.parseScientificInput(targetConcInput);
        const totalVolume = this.parseScientificInput(totalVolumeInput);

        if (isNaN(stockConc) || isNaN(targetConc) || isNaN(totalVolume)) {
            this.showNotification('error', 'Invalid Input', 'Please enter valid numbers using scientific notation (e.g., 1×10⁶)');
            return;
        }

        if (stockConc <= 0 || targetConc <= 0 || totalVolume <= 0) {
            this.showNotification('error', 'Invalid Values', 'All values must be positive');
            return;
        }

        this.showLoading('Calculating CFU preparation...');

        setTimeout(() => {
            try {
                // Convert all to base units (CFU/mL and mL)
                const stockCFU_mL = this.convertCFUToBase(stockConc, stockUnit);
                let targetCFU_mL = this.convertCFUToBase(targetConc, targetUnit);
                const totalVol_mL = this.convertVolumeToBase(totalVolume, volumeUnit);

                // Handle special target units
                if (targetUnit === 'CFU/cm²') {
                    // Convert CFU/cm² to CFU/mL based on well surface area and media volume
                    targetCFU_mL = targetConc * wellSurface * (mediaVolume / 1000); // Convert µL to mL
                } else if (targetUnit === 'CFU/well') {
                    // Convert CFU/well to CFU/mL based on media volume
                    targetCFU_mL = targetConc / (mediaVolume / 1000); // Convert µL to mL
                }

                if (stockCFU_mL <= targetCFU_mL) {
                    this.showNotification('error', 'Concentration Error', 'Stock CFU concentration must be higher than target CFU concentration');
                    this.hideLoading();
                    return;
                }

                // Calculate dilution using C1V1 = C2V2
                const stockVolNeeded_mL = (targetCFU_mL * totalVol_mL) / stockCFU_mL;
                const diluentVol_mL = totalVol_mL - stockVolNeeded_mL;
                const dilutionFactor = stockCFU_mL / targetCFU_mL;

                // Convert results to appropriate units
                const stockVol_µL = stockVolNeeded_mL * 1000;
                const diluentVol_µL = diluentVol_mL * 1000;

                // Calculate additional parameters
                const cfuPerCm2 = targetCFU_mL * (mediaVolume / 1000) / wellSurface;
                const cfuPerWell = targetCFU_mL * (mediaVolume / 1000);

                // Generate multiple volume options
                const batchOptions = [1, 2, 5, 10, 20].map(multiplier => ({
                    factor: multiplier,
                    stockVol: (stockVol_µL * multiplier).toFixed(2),
                    diluentVol: (diluentVol_µL * multiplier).toFixed(2),
                    totalVol: (totalVol_mL * multiplier * 1000).toFixed(1)
                }));

                this.displayCFUResults({
                    stockConc: this.formatScientificOutput(stockConc),
                    stockUnit,
                    targetConc: this.formatScientificOutput(targetConc),
                    targetUnit,
                    stockVolNeeded: stockVol_µL.toFixed(2),
                    diluentVolNeeded: diluentVol_µL.toFixed(2),
                    totalVolume: (totalVol_mL * 1000).toFixed(1),
                    dilutionFactor: this.formatScientificOutput(dilutionFactor),
                    cfuPerCm2: this.formatScientificOutput(cfuPerCm2),
                    cfuPerWell: this.formatScientificOutput(cfuPerWell),
                    batchOptions
                });

                this.hideLoading();
            } catch (error) {
                this.showNotification('error', 'Calculation Error', error.message);
                this.hideLoading();
            }
        }, 800);
    }

    convertCFUToBase(value, unit) {
        switch (unit) {
            case 'CFU/mL': return value;
            case 'CFU/µL': return value * 1000;
            default: return value;
        }
    }

    convertVolumeToBase(value, unit) {
        switch (unit) {
            case 'L': return value * 1000;
            case 'mL': return value;
            case 'µL': return value / 1000;
            default: return value;
        }
    }

    displayCFUResults(results) {
        const resultDiv = document.getElementById('cfu-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-bacteria"></i> CFU Calculation Results</h4>
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 1.5rem; border-radius: 12px; margin: 1rem 0; color: white;">
                <h5 style="margin-bottom: 1rem; font-size: 1.1rem;">📋 Preparation Protocol</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div><strong>Stock Volume Needed:</strong><br>${results.stockVolNeeded} µL</div>
                    <div><strong>Diluent Volume:</strong><br>${results.diluentVolNeeded} µL</div>
                </div>
                <div style="text-align: center; font-size: 1.1rem; font-weight: 700; padding: 0.5rem; background: rgba(255, 255, 255, 0.2); border-radius: 8px;">
                    Total Volume: ${results.totalVolume} µL
                </div>
            </div>

            <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; margin: 1rem 0; border: 2px solid #0ea5e9;">
                <h5 style="color: #0ea5e9; margin-bottom: 1rem;"><i class="fas fa-info-circle"></i> Calculation Details</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem; color: #1e293b;">
                    <div><strong>Stock:</strong> ${results.stockConc} ${results.stockUnit}</div>
                    <div><strong>Target:</strong> ${results.targetConc} ${results.targetUnit}</div>
                    <div><strong>Dilution Factor:</strong> ${results.dilutionFactor}×</div>
                    <div><strong>CFU per cm²:</strong> ${results.cfuPerCm2}</div>
                </div>
            </div>

            <div style="margin-top: 1.5rem;">
                <h5><i class="fas fa-table"></i> Batch Preparation Options</h5>
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: #1e293b; color: white;">
                            <th style="padding: 0.75rem; font-size: 0.9rem;">Batch Size</th>
                            <th style="padding: 0.75rem; font-size: 0.9rem;">Stock (µL)</th>
                            <th style="padding: 0.75rem; font-size: 0.9rem;">Diluent (µL)</th>
                            <th style="padding: 0.75rem; font-size: 0.9rem;">Total (µL)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.batchOptions.map((batch, index) => `
                            <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                                <td style="padding: 0.75rem; text-align: center; font-weight: 600;">${batch.factor}×</td>
                                <td style="padding: 0.75rem; text-align: center;">${batch.stockVol}</td>
                                <td style="padding: 0.75rem; text-align: center;">${batch.diluentVol}</td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 600;">${batch.totalVol}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div style="background: #fefce8; padding: 1rem; border-radius: 8px; margin-top: 1.5rem; border-left: 4px solid #f59e0b;">
                <h6 style="color: #92400e; margin-bottom: 0.5rem;"><i class="fas fa-exclamation-triangle"></i> Protocol Notes</h6>
                <ul style="font-size: 0.85rem; color: #92400e; margin: 0; padding-left: 1.5rem;">
                    <li>Use sterile technique throughout preparation</li>
                    <li>Prepare bacterial dilution fresh before use</li>
                    <li>Mix gently to avoid damaging bacterial cells</li>
                    <li>Validate CFU counts with serial dilution plating</li>
                    <li>Consider temperature effects on bacterial viability</li>
                </ul>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    // **ADDITIONAL CALCULATOR FUNCTIONS**
    calculateDilution() {
        const stockConc = this.parseScientificInput(document.getElementById('dilution-stock-conc').value);
        const targetConc = this.parseScientificInput(document.getElementById('dilution-target-conc').value);
        const finalVol = this.parseScientificInput(document.getElementById('dilution-volume').value);

        if (isNaN(stockConc) || isNaN(targetConc) || isNaN(finalVol)) {
            this.showNotification('error', 'Invalid Input', 'Please enter valid numbers');
            return;
        }

        if (stockConc <= targetConc) {
            this.showNotification('error', 'Concentration Error', 'Stock concentration must be higher than target');
            return;
        }

        const stockVol = (targetConc * finalVol) / stockConc;
        const diluentVol = finalVol - stockVol;

        const resultDiv = document.getElementById('dilution-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-flask"></i> Dilution Protocol</h4>
            <div style="background: #10b981; color: white; padding: 1.5rem; border-radius: 12px;">
                <p><strong>Stock Volume:</strong> ${this.formatScientificOutput(stockVol)} mL</p>
                <p><strong>Diluent Volume:</strong> ${this.formatScientificOutput(diluentVol)} mL</p>
                <p><strong>Dilution Factor:</strong> ${this.formatScientificOutput(stockConc / targetConc)}×</p>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    calculateSerialDilution() {
        const initial = this.parseScientificInput(document.getElementById('serial-initial').value);
        const factor = parseInt(document.getElementById('serial-factor').value);
        const steps = parseInt(document.getElementById('serial-steps').value);

        if (isNaN(initial) || !factor || !steps) {
            this.showNotification('error', 'Invalid Input', 'Please fill all serial dilution fields');
            return;
        }

        const series = [];
        for (let i = 0; i <= steps; i++) {
            series.push({
                step: i,
                concentration: initial / Math.pow(factor, i),
                dilution: i === 0 ? 'Stock' : `1:${Math.pow(factor, i)}`
            });
        }

        const resultDiv = document.getElementById('serial-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-list-ol"></i> Serial Dilution Series</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                <tr style="background: #1e293b; color: white;">
                    <th style="padding: 0.5rem;">Step</th>
                    <th style="padding: 0.5rem;">Dilution</th>
                    <th style="padding: 0.5rem;">Concentration</th>
                </tr>
                ${series.map((item, index) => `
                    <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                        <td style="padding: 0.5rem; text-align: center;">${item.step}</td>
                        <td style="padding: 0.5rem; text-align: center;">${item.dilution}</td>
                        <td style="padding: 0.5rem; text-align: center;">${this.formatScientificOutput(item.concentration)}</td>
                    </tr>
                `).join('')}
            </table>
        `;
        resultDiv.classList.add('show');
    }

    calculateColonies() {
        const colonies = parseInt(document.getElementById('colony-count').value);
        const volumePlated = parseFloat(document.getElementById('volume-plated').value);
        const dilutionFactor = this.parseScientificInput(document.getElementById('dilution-factor').value);

        if (isNaN(colonies) || isNaN(volumePlated) || isNaN(dilutionFactor)) {
            this.showNotification('error', 'Invalid Input', 'Please fill all colony counting fields');
            return;
        }

        const cfuPerMl = (colonies * dilutionFactor) / volumePlated;

        const resultDiv = document.getElementById('colony-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-microscope"></i> CFU/mL Calculation</h4>
            <div style="background: #0ea5e9; color: white; padding: 1.5rem; border-radius: 12px;">
                <p><strong>Original CFU/mL:</strong> ${this.formatScientificOutput(cfuPerMl)}</p>
                <p><strong>Colonies Counted:</strong> ${colonies}</p>
                <p><strong>Volume Plated:</strong> ${volumePlated} mL</p>
                <p><strong>Dilution Factor:</strong> ${this.formatScientificOutput(dilutionFactor)}</p>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    // **ENHANCED PNG EXPORT WITH COMPLETE LABELING**
    async exportPlate(format) {
        if (this.currentLayout.length === 0) {
            this.showNotification('warning', 'No Layout', 'Please generate a plate layout first');
            return;
        }

        this.showLoading(`Exporting ${format.toUpperCase()}...`);

        try {
            switch (format) {
                case 'png':
                    await this.exportEnhancedPNG();
                    break;
                case 'svg':
                    this.exportSVG();
                    break;
                case 'csv':
                    this.exportCSV();
                    break;
                case 'protocol':
                    this.exportProtocol();
                    break;
            }
        } catch (error) {
            this.showNotification('error', 'Export Failed', error.message);
        } finally {
            this.hideLoading();
        }
    }

    async exportEnhancedPNG() {
        // Create high-resolution export container
        const exportContainer = document.createElement('div');
        exportContainer.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            background: white;
            padding: 40px;
            font-family: 'Inter', sans-serif;
            width: 1200px;
        `;

        // Create comprehensive header
        const header = this.createExportHeader();
        
        // Create enhanced plate visualization for export
        const plateViz = this.createExportPlateVisualization();
        
        // Assemble export content
        exportContainer.appendChild(header);
        exportContainer.appendChild(plateViz);
        document.body.appendChild(exportContainer);

        try {
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(exportContainer, {
                    backgroundColor: '#ffffff',
                    scale: 3, // High resolution
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    width: 1200,
                    height: 900
                });
                
                // Download the image
                const link = document.createElement('a');
                const expName = document.getElementById('experiment-name').value || 'plate-layout';
                link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_plate_layout.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
                
                this.showNotification('success', 'Export Complete', 'High-quality PNG with complete labeling downloaded successfully');
            } else {
                this.showNotification('warning', 'Export Library Missing', 'html2canvas library not loaded. Please refresh and try again.');
            }
        } finally {
            document.body.removeChild(exportContainer);
        }
    }

    createExportHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border-bottom: 3px solid #2563eb;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
        `;
        
        const expName = document.getElementById('experiment-name').value || 'Laboratory Experiment';
        const researcher = document.getElementById('researcher-name').value || 'Research Team';
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        
        header.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="font-size: 2rem; color: #2563eb;">🧪</div>
                <h1 style="font-size: 32px; font-weight: 800; color: #1e293b; margin: 0;">${expName}</h1>
            </div>
            <div style="font-size: 18px; color: #475569; margin-bottom: 0.5rem;">
                <strong>Researcher:</strong> ${researcher} | <strong>Date:</strong> ${new Date().toLocaleDateString()}
            </div>
            <div style="font-size: 16px; color: #64748b;">
                ${config.rows}×${config.cols} Plate Layout | Surface Area: ${config.surfaceArea} cm²/well | Generated by PlateMaster Pro
            </div>
        `;

        return header;
    }

    createExportPlateVisualization() {
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            gap: 30px;
            align-items: flex-start;
            justify-content: center;
        `;

        // Create enhanced plate table for export
        const plateTable = this.createExportPlateTable(config);
        
        // Create detailed legend for export
        const legend = this.createExportLegend();

        container.appendChild(plateTable);
        container.appendChild(legend);

        return container;
    }

    createExportPlateTable(config) {
        const { rows, cols, rowLabels } = config;
        
        const tableContainer = document.createElement('div');
        tableContainer.style.textAlign = 'center';

        const table = document.createElement('table');
        table.style.cssText = `
            border-collapse: collapse;
            border: 4px solid #1e293b;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            background: white;
            font-family: 'Inter', sans-serif;
        `;

        // Create header row
        const headerRow = document.createElement('tr');
        const cornerCell = document.createElement('th');
        cornerCell.style.cssText = `
            width: 55px; height: 45px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white; font-weight: 800; font-size: 16px;
        `;
        headerRow.appendChild(cornerCell);

        for (let c = 1; c <= cols; c++) {
            const th = document.createElement('th');
            th.textContent = c;
            th.style.cssText = `
                width: 50px; height: 45px;
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white; text-align: center; font-weight: 800; font-size: 16px;
            `;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Create data rows with enhanced labeling
        for (let r = 0; r < rows; r++) {
            const row = document.createElement('tr');
            
            // Row header
            const rowHeader = document.createElement('th');
            rowHeader.textContent = rowLabels[r];
            rowHeader.style.cssText = `
                width: 55px; height: 50px;
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white; text-align: center; font-weight: 800; font-size: 16px;
            `;
            row.appendChild(rowHeader);

            // Well cells with complete labeling
            for (let c = 0; c < cols; c++) {
                const wellName = `${rowLabels[r]}${c + 1}`;
                const wellData = this.currentLayout.find(w => w.well === wellName);
                
                const cell = document.createElement('td');
                cell.style.cssText = `
                    width: 50px; height: 50px; border: 1px solid #cbd5e1;
                    padding: 2px; text-align: center; position: relative;
                    background: #f8fafc;
                `;

                if (wellData) {
                    // Main well circle
                    const circle = document.createElement('div');
                    circle.style.cssText = `
                        width: 42px; height: 42px; border-radius: 50%; margin: auto;
                        background-color: ${wellData.color};
                        border: 3px solid ${this.darkenColor(wellData.color, 25)};
                        position: relative; display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    `;

                    // Timepoint label inside well
                    const timeLabel = document.createElement('div');
                    timeLabel.style.cssText = `
                        font-size: 9px; font-weight: 800; color: white;
                        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                        line-height: 1; text-align: center;
                    `;
                    timeLabel.textContent = wellData.timepoint;
                    circle.appendChild(timeLabel);

                    // Replicate label below well
                    const replicateLabel = document.createElement('div');
                    replicateLabel.style.cssText = `
                        position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
                        font-size: 7px; font-weight: 700; color: #1e293b;
                        background: rgba(255, 255, 255, 0.95); padding: 1px 4px;
                        border-radius: 4px; border: 1px solid #e5e7eb;
                        white-space: nowrap; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    `;
                    replicateLabel.textContent = `B${wellData.bioReplicate}T${wellData.techReplicate}`;

                    cell.appendChild(circle);
                    cell.appendChild(replicateLabel);
                } else {
                    // Empty well
                    const circle = document.createElement('div');
                    circle.style.cssText = `
                        width: 42px; height: 42px; border-radius: 50%; margin: auto;
                        background-color: #e2e8f0; border: 2px solid #cbd5e1;
                    `;
                    cell.appendChild(circle);
                }

                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        tableContainer.appendChild(table);
        return tableContainer;
    }

    createExportLegend() {
        const legendContainer = document.createElement('div');
        legendContainer.style.cssText = `
            background: white; border: 3px solid #e2e8f0;
            border-radius: 16px; padding: 20px; min-width: 300px; max-width: 350px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        `;

        const title = document.createElement('h3');
        title.innerHTML = '🎨 Group Legend & Statistics';
        title.style.cssText = `
            margin: 0 0 20px 0; font-size: 18px; font-weight: 800;
            color: #1e293b; padding-bottom: 10px; border-bottom: 3px solid #e2e8f0;
        `;
        legendContainer.appendChild(title);

        // Group legend items
        const uniqueGroups = [...new Set(this.currentLayout.map(item => item.group))];
        
        uniqueGroups.forEach(group => {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex; align-items: center; gap: 12px; padding: 10px;
                margin-bottom: 8px; background: #f8fafc; border-radius: 8px;
                border: 1px solid #f1f5f9;
            `;

            const colorSquare = document.createElement('div');
            colorSquare.style.cssText = `
                width: 24px; height: 24px; border-radius: 6px;
                background-color: ${this.currentColors[group]};
                border: 2px solid white; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                flex-shrink: 0;
            `;

            const groupInfo = document.createElement('div');
            const groupWells = this.currentLayout.filter(item => item.group === group);
            
            groupInfo.innerHTML = `
                <div style="font-weight: 700; color: #1e293b; font-size: 14px;">${group}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                    ${groupWells.length} wells • ${groupWells[0]?.type || 'experimental'}
                </div>
            `;

            item.appendChild(colorSquare);
            item.appendChild(groupInfo);
            legendContainer.appendChild(item);
        });

        // Statistics summary
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        const stats = document.createElement('div');
        stats.style.cssText = `
            margin-top: 20px; padding-top: 15px; border-top: 2px solid #e2e8f0;
            background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%);
            padding: 15px; border-radius: 8px; font-size: 12px; color: #475569;
        `;
        
        const utilization = ((this.currentLayout.length / (config.rows * config.cols)) * 100).toFixed(1);
        
        stats.innerHTML = `
            <div style="font-weight: 700; color: #2563eb; margin-bottom: 8px; font-size: 14px;">📊 Layout Summary</div>
            <div style="margin-bottom: 4px;"><strong>Total Groups:</strong> ${uniqueGroups.length}</div>
            <div style="margin-bottom: 4px;"><strong>Wells Used:</strong> ${this.currentLayout.length} / ${config.rows * config.cols}</div>
            <div style="margin-bottom: 4px;"><strong>Utilization:</strong> ${utilization}%</div>
            <div style="margin-bottom: 4px;"><strong>Surface Area:</strong> ${(this.currentLayout.length * config.surfaceArea).toFixed(2)} cm²</div>
            <div style="margin-top: 8px; font-size: 10px; color: #94a3b8; text-align: center;">
                Generated: ${new Date().toLocaleString()}
            </div>
        `;
        
        legendContainer.appendChild(stats);
        return legendContainer;
    }

    exportCSV() {
        let csv = 'Well,Group,Timepoint,BioReplicate,TechReplicate,Type,Color,SurfaceArea_cm2\n';
        
        this.currentLayout.forEach(item => {
            const plateFormat = document.getElementById('plate-format').value;
            const surfaceArea = this.plateConfigs[plateFormat].surfaceArea;
            csv += `"${item.well}","${item.group}","${item.timepoint}","${item.bioReplicate}","${item.techReplicate}","${item.type}","${item.color}","${surfaceArea}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        const expName = document.getElementById('experiment-name').value || 'plate-layout';
        link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_data.csv`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'CSV Export Complete', 'Plate data exported successfully');
    }

    exportSVG() {
        // SVG export would require recreating the visualization as SVG
        this.showNotification('info', 'SVG Export', 'SVG export feature coming soon!');
    }

    exportProtocol() {
        const expName = document.getElementById('experiment-name').value || 'Laboratory Experiment';
        const researcher = document.getElementById('researcher-name').value || 'Research Team';
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        
        let protocol = `EXPERIMENTAL PROTOCOL\n`;
        protocol += `${'='.repeat(50)}\n\n`;
        protocol += `Experiment: ${expName}\n`;
        protocol += `Researcher: ${researcher}\n`;
        protocol += `Date: ${new Date().toLocaleDateString()}\n`;
        protocol += `Plate Format: ${plateFormat}-well (${config.rows}×${config.cols})\n`;
        protocol += `Surface Area: ${config.surfaceArea} cm² per well\n`;
        protocol += `Working Volume: ${config.workingVolume} µL per well\n`;
        protocol += `Wells Used: ${this.currentLayout.length}\n\n`;
        
        const uniqueGroups = [...new Set(this.currentLayout.map(item => item.group))];
        protocol += `EXPERIMENTAL GROUPS (${uniqueGroups.length}):\n`;
        protocol += `${'-'.repeat(30)}\n`;
        uniqueGroups.forEach((group, index) => {
            const groupWells = this.currentLayout.filter(item => item.group === group);
            protocol += `${index + 1}. ${group} (${groupWells.length} wells)\n`;
        });
        
        protocol += `\nWELL ASSIGNMENTS:\n`;
        protocol += `${'-'.repeat(30)}\n`;
        this.currentLayout.forEach(item => {
            protocol += `${item.well}: ${item.group} | ${item.timepoint} | Bio${item.bioReplicate} | Tech${item.techReplicate} | ${item.type}\n`;
        });

        protocol += `\nSTATISTICS:\n`;
        protocol += `${'-'.repeat(30)}\n`;
        protocol += `Total Wells: ${this.currentLayout.length}\n`;
        protocol += `Utilization: ${((this.currentLayout.length / (config.rows * config.cols)) * 100).toFixed(1)}%\n`;
        protocol += `Total Surface Area: ${(this.currentLayout.length * config.surfaceArea).toFixed(2)} cm²\n`;

        protocol += `\n${'='.repeat(50)}\n`;
        protocol += `Generated by PlateMaster Pro\n`;
        protocol += `Timestamp: ${new Date().toISOString()}\n`;

        const blob = new Blob([protocol], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_protocol.txt`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showNotification('success', 'Protocol Export Complete', 'Experimental protocol downloaded successfully');
    }

    // **UTILITY FUNCTIONS**
    updatePlateParameters() {
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        
        // Update form fields
        if (document.getElementById('well-surface-area')) {
            document.getElementById('well-surface-area').value = config.surfaceArea;
        }
        if (document.getElementById('well-volume')) {
            document.getElementById('well-volume').value = config.workingVolume;
        }
        if (document.getElementById('well-surface')) {
            document.getElementById('well-surface').value = config.surfaceArea;
        }
        if (document.getElementById('media-volume')) {
            document.getElementById('media-volume').value = config.workingVolume;
        }
        
        this.updateStatistics();
        this.drawEmptyPlate();
    }

    updateColorScheme() {
        const assayType = document.getElementById('assay-type').value;
        // Color scheme will be applied when generating layout
        this.showNotification('info', 'Color Scheme Updated', `Using ${assayType} color scheme for next layout generation`);
    }

    resetPlateDefaults() {
        this.updatePlateParameters();
        this.showNotification('info', 'Defaults Reset', 'Plate parameters reset to standard values');
    }

    updateStatistics() {
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
        document.getElementById('surface-area').textContent = totalSurface;
    }

    updatePlateTitle() {
        const expName = document.getElementById('experiment-name').value || 'Plate Layout Visualization';
        document.getElementById('plate-title').textContent = expName;
    }

    updateGlobalStatistics() {
        this.statistics.experiments++;
        this.statistics.wells += this.currentLayout.length;
        
        localStorage.setItem('plateMasterStats', JSON.stringify(this.statistics));
        
        document.getElementById('total-experiments').textContent = this.statistics.experiments;
        document.getElementById('total-wells').textContent = this.statistics.wells;
    }

    loadStatistics() {
        const saved = localStorage.getItem('plateMasterStats');
        if (saved) {
            this.statistics = JSON.parse(saved);
        }
        
        document.getElementById('total-experiments').textContent = this.statistics.experiments;
        document.getElementById('total-wells').textContent = this.statistics.wells;
    }

    adjustZoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
        
        const container = document.getElementById('plate-display');
        container.style.transform = `scale(${this.zoomLevel})`;
        container.style.transformOrigin = 'center top';
    }

    toggleFullscreen() {
        const container = document.getElementById('plate-display');
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(() => {
                this.showNotification('error', 'Fullscreen Error', 'Could not enter fullscreen mode');
            });
        } else {
            document.exitFullscreen();
        }
    }

    handleTabSwitch(tabName) {
        // Handle any tab-specific loading logic
        if (tabName === 'calculator') {
            // Focus on first scientific input
            setTimeout(() => {
                const firstInput = document.querySelector('.scientific-input');
                if (firstInput) firstInput.focus();
            }, 100);
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

    showWelcomeNotification() {
        setTimeout(() => {
            this.showNotification('success', 'Welcome to PlateMaster Pro! 🧪', 
                'Your ultimate laboratory design tool is ready. Start by adding treatment groups and timepoints!');
        }, 1000);
    }

    showLoading(message = 'Processing...') {
        const loading = document.getElementById('loading-overlay');
        document.getElementById('loading-text').textContent = message;
        loading.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('plateMasterSettings') || '{}');
            return {
                colorScheme: settings.colorScheme || 'bacterial',
                showLabels: settings.showLabels !== false,
                exportQuality: settings.exportQuality || 'high'
            };
        } catch {
            return {
                colorScheme: 'bacterial',
                showLabels: true,
                exportQuality: 'high'
            };
        }
    }
}

// Initialize the application
const app = new PlateMasterPro();

// Global helper functions for quick add buttons
window.addQuickGroups = function(type) {
    const groupSets = {
        'bacterial': ['Control', 'E. coli', 'S. aureus', 'P. aeruginosa'],
        'dose': ['Control', '0.1µM', '1µM', '10µM', '100µM'],
        'controls': ['Negative Control', 'Positive Control', 'Vehicle Control']
    };
    
    const groups = groupSets[type] || [];
    groups.forEach(group => {
        app.addTag(document.getElementById('groups-container'), group);
    });
    app.updateStatistics();
};

window.addQuickTimepoints = function(type) {
    const timeSets = {
        'standard': ['4h', '24h'],
        'kinetic': ['0h', '2h', '4h', '8h', '24h'],
        'extended': ['24h', '48h', '72h', '96h']
    };
    
    const timepoints = timeSets[type] || [];
    timepoints.forEach(timepoint => {
        app.addTag(document.getElementById('timepoints-container'), timepoint);
    });
    app.updateStatistics();
};

window.exportPlate = function(format) {
    app.exportPlate(format);
};

console.log('🧪 PlateMaster Pro Ultimate - Fully loaded and ready for scientific excellence!');
