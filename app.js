/**
 * PlateMaster Pro - Professional Laboratory Tool
 * Clean, efficient, and comprehensive CFU calculator with plate visualization
 */

class PlateMasterPro {
    constructor() {
        // Plate configurations with accurate laboratory data
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
        this.colorSchemes = [
            '#2563eb', '#dc2626', '#16a34a', '#ca8a04', 
            '#9333ea', '#ef4444', '#0891b2', '#be185d',
            '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'
        ];

        // Application state
        this.currentLayout = [];
        this.zoomLevel = 1;
        this.layoutCount = this.loadLayoutCount();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabSwitching();
        this.setupTagInputs();
        this.setupCalculators();
        this.updatePlateDisplay();
        this.updateLayoutCount();
    }

    // **EVENT LISTENERS SETUP**
    setupEventListeners() {
        // Main generation button
        document.getElementById('generate-layout').addEventListener('click', () => this.generateLayout());

        // Plate controls
        document.getElementById('zoom-in').addEventListener('click', () => this.adjustZoom(1.2));
        document.getElementById('zoom-out').addEventListener('click', () => this.adjustZoom(0.8));
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());

        // Form updates
        document.getElementById('plate-format').addEventListener('change', () => this.updatePlateDisplay());
        document.getElementById('well-volume').addEventListener('change', () => this.updateStats());
        
        // Real-time stats updates
        ['bio-replicates', 'tech-replicates'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateStats());
        });

        // Title updates
        document.getElementById('experiment-name').addEventListener('input', (e) => {
            document.getElementById('plate-title').textContent = e.target.value || 'Plate Visualization';
        });
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.nav-btn');
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

    setupTagInputs() {
        this.setupTagInput('group-input', 'groups-container');
        this.setupTagInput('timepoint-input', 'timepoints-container');
    }

    setupTagInput(inputId, containerId) {
        const input = document.getElementById(inputId);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                this.addTag(containerId, input.value.trim());
                input.value = '';
                this.updateStats();
            }
        });
    }

    addTag(containerId, text) {
        const container = document.getElementById(containerId);
        
        // Check for duplicates
        const existingTags = Array.from(container.querySelectorAll('.tag')).map(tag => 
            tag.textContent.replace('×', '').trim()
        );
        
        if (existingTags.includes(text)) {
            this.showNotification('warning', 'Duplicate Entry', `"${text}" already exists`);
            return;
        }

        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `${text}<span class="tag-remove" onclick="this.parentElement.remove(); app.updateStats();">×</span>`;
        
        const input = container.querySelector('.tag-input');
        container.insertBefore(tag, input);
    }

    getTags(containerId) {
        const container = document.getElementById(containerId);
        return Array.from(container.querySelectorAll('.tag')).map(tag => 
            tag.textContent.replace('×', '').trim()
        );
    }

    // **PLATE LAYOUT GENERATION**
    generateLayout() {
        const groups = this.getTags('groups-container');
        const timepoints = this.getTags('timepoints-container');
        const bioReps = parseInt(document.getElementById('bio-replicates').value) || 3;
        const techReps = parseInt(document.getElementById('tech-replicates').value) || 3;
        const includeControls = document.getElementById('include-controls').checked;

        // Validation
        if (groups.length === 0) {
            this.showNotification('error', 'Missing Groups', 'Please add at least one treatment group');
            return;
        }

        if (timepoints.length === 0) {
            this.showNotification('error', 'Missing Timepoints', 'Please add at least one time point');
            return;
        }

        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        
        let totalWells = groups.length * timepoints.length * bioReps * techReps;
        if (includeControls) {
            totalWells += timepoints.length * bioReps * techReps * 2; // Positive and negative controls
        }

        if (totalWells > config.rows * config.cols) {
            this.showNotification('error', 'Insufficient Wells', 
                `Design requires ${totalWells} wells but only ${config.rows * config.cols} available`);
            return;
        }

        this.showLoading('Generating layout...');

        setTimeout(() => {
            this.createLayout(groups, timepoints, bioReps, techReps, includeControls, config);
            this.hideLoading();
        }, 500);
    }

    createLayout(groups, timepoints, bioReps, techReps, includeControls, config) {
        this.currentLayout = [];
        let wellIndex = 0;

        // Generate experimental wells
        groups.forEach((group, groupIndex) => {
            const color = this.colorSchemes[groupIndex % this.colorSchemes.length];
            
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
                                color: color
                            });
                            wellIndex++;
                        }
                    }
                }
            });
        });

        // Add control wells if requested
        if (includeControls) {
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
                                color: '#f59e0b'
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
                                color: '#6b7280'
                            });
                            wellIndex++;
                        }
                    }
                }
            });
        }

        this.drawPlate();
        this.updateStats();
        this.updateLayoutCount();

        this.showNotification('success', 'Layout Generated!', 
            `Successfully created layout with ${this.currentLayout.length} wells`);
    }

    getWellName(index, config) {
        const row = config.rowLabels[Math.floor(index / config.cols)];
        const col = (index % config.cols) + 1;
        return `${row}${col}`;
    }

    // **PLATE VISUALIZATION**
    updatePlateDisplay() {
        if (this.currentLayout.length === 0) {
            this.drawEmptyPlate();
        } else {
            this.drawPlate();
        }
        this.updateStats();
    }

    drawEmptyPlate() {
        const container = document.getElementById('plate-display');
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];

        container.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 3rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;">
                    <i class="fas fa-th"></i>
                </div>
                <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">
                    ${config.rows}×${config.cols} Plate Ready
                </h3>
                <p style="max-width: 400px; margin: 0 auto;">
                    Add treatment groups and timepoints, then click "Generate Plate Layout" 
                    to create your experimental design.
                </p>
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #bae6fd;">
                    <strong>Specifications:</strong><br>
                    Surface Area: ${config.surfaceArea} cm² per well<br>
                    Working Volume: ${config.workingVolume} µL
                </div>
            </div>
        `;
    }

    drawPlate() {
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];
        const container = document.getElementById('plate-display');

        const plateWrapper = document.createElement('div');
        plateWrapper.style.cssText = `
            display: flex;
            gap: 2rem;
            align-items: flex-start;
            justify-content: center;
            padding: 2rem;
        `;

        // Create plate table
        const plateTable = this.createPlateTable(config);
        
        // Create legend
        const legend = this.createLegend();

        plateWrapper.appendChild(plateTable);
        plateWrapper.appendChild(legend);
        container.innerHTML = '';
        container.appendChild(plateWrapper);

        // Apply zoom
        container.style.transform = `scale(${this.zoomLevel})`;
        container.style.transformOrigin = 'center top';
    }

    createPlateTable(config) {
        const { rows, cols, rowLabels } = config;
        const showLabels = document.getElementById('show-labels').checked;

        const tableContainer = document.createElement('div');
        const table = document.createElement('table');
        table.className = 'plate-table';

        // Header row
        const headerRow = document.createElement('tr');
        const cornerCell = document.createElement('th');
        cornerCell.style.cssText = 'width: 50px; height: 40px;';
        headerRow.appendChild(cornerCell);

        for (let c = 1; c <= cols; c++) {
            const th = document.createElement('th');
            th.textContent = c;
            th.style.cssText = 'width: 45px; height: 40px;';
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Data rows
        for (let r = 0; r < rows; r++) {
            const row = document.createElement('tr');
            
            // Row header
            const rowHeader = document.createElement('th');
            rowHeader.textContent = rowLabels[r];
            rowHeader.style.cssText = 'width: 50px; height: 45px;';
            row.appendChild(rowHeader);

            // Well cells
            for (let c = 0; c < cols; c++) {
                const wellName = `${rowLabels[r]}${c + 1}`;
                const wellData = this.currentLayout.find(w => w.well === wellName);
                
                const cell = document.createElement('td');
                const circle = document.createElement('div');
                circle.className = 'well-circle';

                if (wellData) {
                    circle.style.backgroundColor = wellData.color;
                    circle.style.border = `2px solid ${this.darkenColor(wellData.color, 20)}`;
                    
                    // Add timepoint label if enabled
                    if (showLabels && wellData.timepoint) {
                        const label = document.createElement('div');
                        label.className = 'well-label';
                        label.textContent = wellData.timepoint;
                        circle.appendChild(label);
                    }

                    // Enhanced tooltip
                    circle.title = `${wellName}: ${wellData.group}\nTime: ${wellData.timepoint}\nBio Rep: ${wellData.bioReplicate}\nTech Rep: ${wellData.techReplicate}\nType: ${wellData.type}`;
                    
                    // Add replicate label if enabled
                    if (showLabels) {
                        const replicateLabel = document.createElement('div');
                        replicateLabel.className = 'replicate-label';
                        replicateLabel.textContent = `B${wellData.bioReplicate}T${wellData.techReplicate}`;
                        cell.appendChild(replicateLabel);
                    }
                } else {
                    circle.style.backgroundColor = '#e2e8f0';
                    circle.style.border = '2px solid #cbd5e1';
                    circle.title = `${wellName}: Empty well`;
                }

                cell.appendChild(circle);
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        tableContainer.appendChild(table);
        return tableContainer;
    }

    createLegend() {
        const legendContainer = document.createElement('div');
        legendContainer.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 2px solid #e2e8f0;
            min-width: 280px;
            max-width: 320px;
        `;

        const title = document.createElement('h3');
        title.innerHTML = '<i class="fas fa-palette" style="color: #3b82f6; margin-right: 0.5rem;"></i>Group Legend';
        title.style.cssText = `
            margin: 0 0 1.5rem 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: #1e293b;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        `;
        legendContainer.appendChild(title);

        if (this.currentLayout.length > 0) {
            const uniqueGroups = [...new Set(this.currentLayout.map(item => item.group))];
            
            uniqueGroups.forEach(group => {
                const groupWells = this.currentLayout.filter(item => item.group === group);
                const color = groupWells[0].color;

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
                    background-color: ${color};
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    flex-shrink: 0;
                `;

                const groupInfo = document.createElement('div');
                const groupName = document.createElement('div');
                groupName.style.cssText = `
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 0.9rem;
                `;
                groupName.textContent = group;

                const groupDetails = document.createElement('div');
                groupDetails.style.cssText = `
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                `;
                groupDetails.textContent = `${groupWells.length} wells • ${groupWells[0].type}`;

                groupInfo.appendChild(groupName);
                groupInfo.appendChild(groupDetails);
                item.appendChild(colorSquare);
                item.appendChild(groupInfo);
                legendContainer.appendChild(item);

                // Hover effect
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#e2e8f0';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = '#f8fafc';
                });
            });

            // Summary
            const plateFormat = document.getElementById('plate-format').value;
            const config = this.plateConfigs[plateFormat];
            const summary = document.createElement('div');
            summary.style.cssText = `
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 2px solid #e2e8f0;
                font-size: 0.8rem;
                color: #64748b;
            `;
            
            const utilization = ((this.currentLayout.length / (config.rows * config.cols)) * 100).toFixed(1);
            summary.innerHTML = `
                <div style="margin-bottom: 0.5rem;"><strong>Total Groups:</strong> ${uniqueGroups.length}</div>
                <div style="margin-bottom: 0.5rem;"><strong>Wells Used:</strong> ${this.currentLayout.length}</div>
                <div><strong>Utilization:</strong> ${utilization}%</div>
            `;
            legendContainer.appendChild(summary);
        }

        return legendContainer;
    }

    // **CALCULATOR SETUP**
    setupCalculators() {
        // Single strain CFU calculator
        document.getElementById('calculate-single-cfu').addEventListener('click', () => this.calculateSingleCFU());
        
        // Colony counter
        document.getElementById('calculate-colonies').addEventListener('click', () => this.calculateColonies());
        
        // Serial dilution
        document.getElementById('calculate-serial').addEventListener('click', () => this.calculateSerial());
        
        // Universal dilution
        document.getElementById('calculate-dilution').addEventListener('click', () => this.calculateDilution());
        
        // Multi-strain setup
        this.setupMultiStrain();
    }

    // **SINGLE STRAIN CFU CALCULATOR**
    calculateSingleCFU() {
        const stockConcInput = document.getElementById('stock-conc').value;
        const stockUnit = document.getElementById('stock-unit').value;
        const targetConcInput = document.getElementById('target-conc').value;
        const targetUnit = document.getElementById('target-unit').value;
        const totalVolumeInput = document.getElementById('total-volume').value;
        const volumeUnit = document.getElementById('volume-unit').value;

        // Parse inputs using scientific notation
        const stockConc = this.parseScientificInput(stockConcInput);
        const targetConc = this.parseScientificInput(targetConcInput);
        const totalVolume = this.parseScientificInput(totalVolumeInput);

        if (isNaN(stockConc) || isNaN(targetConc) || isNaN(totalVolume)) {
            this.showNotification('error', 'Invalid Input', 'Please enter valid numbers (supports scientific notation like 1×10⁶)');
            return;
        }

        if (stockConc <= 0 || targetConc <= 0 || totalVolume <= 0) {
            this.showNotification('error', 'Invalid Values', 'All values must be positive');
            return;
        }

        // Convert units to base (CFU/mL and mL)
        const stockCFU_mL = this.convertCFUToBase(stockConc, stockUnit);
        let targetCFU_mL = this.convertCFUToBase(targetConc, targetUnit);
        const totalVol_mL = this.convertVolumeToBase(totalVolume, volumeUnit);

        // Handle special target units
        if (targetUnit === 'CFU/cm²') {
            const wellVolume = parseFloat(document.getElementById('well-volume').value) || 200;
            const plateFormat = document.getElementById('plate-format').value;
            const surfaceArea = this.plateConfigs[plateFormat].surfaceArea;
            targetCFU_mL = targetConc * surfaceArea * (wellVolume / 1000);
        } else if (targetUnit === 'CFU/well') {
            const wellVolume = parseFloat(document.getElementById('well-volume').value) || 200;
            targetCFU_mL = targetConc / (wellVolume / 1000);
        }

        if (stockCFU_mL <= targetCFU_mL) {
            this.showNotification('error', 'Concentration Error', 'Stock concentration must be higher than target');
            return;
        }

        // Calculate using C1V1 = C2V2
        const stockVolNeeded_mL = (targetCFU_mL * totalVol_mL) / stockCFU_mL;
        const diluentVol_mL = totalVol_mL - stockVolNeeded_mL;
        const dilutionFactor = stockCFU_mL / targetCFU_mL;

        // Convert to µL for display
        const stockVol_µL = stockVolNeeded_mL * 1000;
        const diluentVol_µL = diluentVol_mL * 1000;

        this.displaySingleCFUResult({
            stockVol_µL: stockVol_µL.toFixed(2),
            diluentVol_µL: diluentVol_µL.toFixed(2),
            totalVol_mL: totalVol_mL.toFixed(1),
            dilutionFactor: this.formatScientific(dilutionFactor),
            stockConc: this.formatScientific(stockConc),
            targetConc: this.formatScientific(targetConc),
            stockUnit,
            targetUnit
        });
    }

    displaySingleCFUResult(results) {
        const resultDiv = document.getElementById('single-cfu-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-bacteria"></i> CFU Calculation Results</h4>
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 1.5rem; border-radius: 12px; margin: 1rem 0; color: white;">
                <h5 style="margin-bottom: 1rem;">Preparation Protocol</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div><strong>Stock Volume:</strong><br>${results.stockVol_µL} µL</div>
                    <div><strong>Diluent Volume:</strong><br>${results.diluentVol_µL} µL</div>
                </div>
                <div style="text-align: center; font-size: 1.1rem; font-weight: 700; padding: 0.5rem; background: rgba(255, 255, 255, 0.2); border-radius: 8px;">
                    Total Volume: ${results.totalVol_mL} mL
                </div>
            </div>

            <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #0ea5e9;">
                <h5 style="color: #0ea5e9; margin-bottom: 1rem;">Calculation Details</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                    <div><strong>Stock:</strong> ${results.stockConc} ${results.stockUnit}</div>
                    <div><strong>Target:</strong> ${results.targetConc} ${results.targetUnit}</div>
                    <div><strong>Dilution Factor:</strong> ${results.dilutionFactor}×</div>
                    <div><strong>Method:</strong> C₁V₁ = C₂V₂</div>
                </div>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    // **MULTI-STRAIN CFU CALCULATOR**
    setupMultiStrain() {
        document.getElementById('add-strain').addEventListener('click', () => this.addStrain());
        document.getElementById('calculate-multi-cfu').addEventListener('click', () => this.calculateMultiStrain());
        
        // Add initial strains
        this.addStrain();
        this.addStrain();
    }

    addStrain() {
        const container = document.getElementById('strains-container');
        const strainCount = container.children.length + 1;
        
        const strainDiv = document.createElement('div');
        strainDiv.className = 'strain-input-group';
        strainDiv.innerHTML = `
            <button class="remove-strain" onclick="this.parentElement.remove()">×</button>
            <h5><i class="fas fa-bacteria"></i> Strain ${strainCount}</h5>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Strain Name</label>
                    <input type="text" class="strain-name form-input" placeholder="e.g., E. coli">
                </div>
                <div class="form-group">
                    <label>Stock Concentration</label>
                    <input type="text" class="strain-stock-conc form-input scientific-input" placeholder="e.g., 1×10⁹">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Target Concentration</label>
                    <input type="text" class="strain-target-conc form-input scientific-input" placeholder="e.g., 1×10⁶">
                </div>
                <div class="form-group">
                    <label>Ratio</label>
                    <input type="number" class="strain-ratio form-input" value="1" min="0.1" step="0.1">
                </div>
            </div>
        `;
        
        container.appendChild(strainDiv);
    }

    calculateMultiStrain() {
        const totalVolumeInput = document.getElementById('multi-total-volume').value;
        const volumeUnit = document.getElementById('multi-volume-unit').value;
        
        const totalVolume = this.parseScientificInput(totalVolumeInput);
        
        if (isNaN(totalVolume) || totalVolume <= 0) {
            this.showNotification('error', 'Invalid Volume', 'Please enter a valid total volume');
            return;
        }
        
        // Get all strain data
        const strains = [];
        const strainInputs = document.querySelectorAll('.strain-input-group');
        
        strainInputs.forEach((strainDiv, index) => {
            const name = strainDiv.querySelector('.strain-name').value || `Strain ${index + 1}`;
            const stockConc = this.parseScientificInput(strainDiv.querySelector('.strain-stock-conc').value);
            const targetConc = this.parseScientificInput(strainDiv.querySelector('.strain-target-conc').value);
            const ratio = parseFloat(strainDiv.querySelector('.strain-ratio').value) || 1;
            
            if (!isNaN(stockConc) && !isNaN(targetConc) && stockConc > 0 && targetConc > 0) {
                strains.push({ name, stockConc, targetConc, ratio, index });
            }
        });
        
        if (strains.length < 2) {
            this.showNotification('error', 'Insufficient Strains', 'Please add at least 2 valid bacterial strains');
            return;
        }
        
        this.performMultiStrainCalculation(strains, totalVolume, volumeUnit);
    }

    performMultiStrainCalculation(strains, totalVolume, volumeUnit) {
        const totalVol_mL = this.convertVolumeToBase(totalVolume, volumeUnit);
        
        const calculations = [];
        let totalStockVolume = 0;
        
        // Calculate individual stock volumes needed
        strains.forEach(strain => {
            const stockCFU_mL = strain.stockConc; // Assume CFU/mL
            const adjustedTarget = strain.targetConc * strain.ratio;
            
            if (stockCFU_mL <= adjustedTarget) {
                this.showNotification('error', 'Concentration Error', 
                    `Stock concentration for ${strain.name} is too low`);
                return;
            }
            
            const stockVol_mL = (adjustedTarget * totalVol_mL) / stockCFU_mL;
            const stockVol_µL = stockVol_mL * 1000;
            
            totalStockVolume += stockVol_mL;
            
            calculations.push({
                ...strain,
                stockVol_mL,
                stockVol_µL,
                adjustedTarget,
                dilutionFactor: stockCFU_mL / adjustedTarget
            });
        });
        
        if (totalStockVolume >= totalVol_mL) {
            this.showNotification('error', 'Volume Error', 
                'Total stock volume exceeds target volume. Reduce concentrations or increase total volume.');
            return;
        }
        
        const diluentVol_mL = totalVol_mL - totalStockVolume;
        const diluentVol_µL = diluentVol_mL * 1000;
        
        this.displayMultiStrainResult({
            calculations,
            totalVol_mL,
            totalStockVol_mL: totalStockVolume,
            diluentVol_µL,
            strainCount: strains.length
        });
    }

    displayMultiStrainResult(results) {
        const resultDiv = document.getElementById('multi-cfu-result');
        
        const strainBreakdown = results.calculations.map((calc, index) => `
            <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                <td style="padding: 0.75rem; font-weight: 600;">${calc.name}</td>
                <td style="padding: 0.75rem; text-align: center;">${calc.stockVol_µL.toFixed(2)} µL</td>
                <td style="padding: 0.75rem; text-align: center;">${this.formatScientific(calc.stockConc)}</td>
                <td style="padding: 0.75rem; text-align: center;">${this.formatScientific(calc.adjustedTarget)}</td>
            </tr>
        `).join('');
        
        resultDiv.innerHTML = `
            <h4><i class="fas fa-flask-potion"></i> Multi-Strain Mixture Protocol</h4>
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2rem; border-radius: 16px; margin: 1.5rem 0; color: white;">
                <h5 style="margin-bottom: 1.5rem;">Mixing Summary</h5>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.15); padding: 1rem; border-radius: 8px;">
                        <div style="font-size: 1.8rem; font-weight: 800;">${results.strainCount}</div>
                        <div style="font-size: 0.9rem;">Strains</div>
                    </div>
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.15); padding: 1rem; border-radius: 8px;">
                        <div style="font-size: 1.8rem; font-weight: 800;">${results.totalStockVol_mL.toFixed(2)}</div>
                        <div style="font-size: 0.9rem;">Stock (mL)</div>
                    </div>
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.15); padding: 1rem; border-radius: 8px;">
                        <div style="font-size: 1.8rem; font-weight: 800;">${(results.diluentVol_µL/1000).toFixed(2)}</div>
                        <div style="font-size: 0.9rem;">Diluent (mL)</div>
                    </div>
                </div>
            </div>

            <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #0ea5e9;">
                <h5 style="color: #0ea5e9; margin-bottom: 1rem;">Strain-by-Strain Breakdown</h5>
                <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: #1e293b; color: white;">
                            <th style="padding: 1rem; text-align: left;">Strain</th>
                            <th style="padding: 1rem; text-align: center;">Volume</th>
                            <th style="padding: 1rem; text-align: center;">Stock</th>
                            <th style="padding: 1rem; text-align: center;">Target</th>
                        </tr>
                    </thead>
                    <tbody>${strainBreakdown}</tbody>
                </table>
            </div>

            <div style="background: #fffbeb; padding: 1.5rem; border-radius: 12px; margin-top: 1rem; border-left: 6px solid #f59e0b;">
                <h5 style="color: #92400e; margin-bottom: 1rem;">Protocol Steps</h5>
                <ol style="color: #92400e; padding-left: 1.5rem;">
                    ${results.calculations.map((calc, index) => `
                        <li style="margin-bottom: 0.5rem;">Add ${calc.stockVol_µL.toFixed(2)} µL of ${calc.name} stock</li>
                    `).join('')}
                    <li>Add ${results.diluentVol_µL.toFixed(2)} µL of sterile media</li>
                    <li>Mix gently and use immediately</li>
                </ol>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    // **OTHER CALCULATORS**
    calculateColonies() {
        const colonies = parseInt(document.getElementById('colony-count').value);
        const volumePlated = parseFloat(document.getElementById('volume-plated').value);
        const dilutionFactor = this.parseScientificInput(document.getElementById('dilution-factor').value);

        if (isNaN(colonies) || isNaN(volumePlated) || isNaN(dilutionFactor)) {
            this.showNotification('error', 'Invalid Input', 'Please fill all fields with valid numbers');
            return;
        }

        const cfuPerMl = (colonies * dilutionFactor) / volumePlated;

        const resultDiv = document.getElementById('colony-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-microscope"></i> CFU/mL Calculation</h4>
            <div style="background: #0ea5e9; color: white; padding: 1.5rem; border-radius: 12px;">
                <p style="font-size: 1.2rem; margin-bottom: 1rem;"><strong>Result: ${this.formatScientific(cfuPerMl)} CFU/mL</strong></p>
                <hr style="margin: 1rem 0; opacity: 0.3;">
                <p><strong>Colonies Counted:</strong> ${colonies}</p>
                <p><strong>Volume Plated:</strong> ${volumePlated} mL</p>
                <p><strong>Dilution Factor:</strong> ${this.formatScientific(dilutionFactor)}</p>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    calculateSerial() {
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
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #1e293b; color: white;">
                        <th style="padding: 0.75rem;">Step</th>
                        <th style="padding: 0.75rem;">Dilution</th>
                        <th style="padding: 0.75rem;">Concentration</th>
                    </tr>
                </thead>
                <tbody>
                    ${series.map((item, index) => `
                        <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                            <td style="padding: 0.75rem; text-align: center;">${item.step}</td>
                            <td style="padding: 0.75rem; text-align: center;">${item.dilution}</td>
                            <td style="padding: 0.75rem; text-align: center; font-family: monospace;">${this.formatScientific(item.concentration)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        resultDiv.classList.add('show');
    }

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
        const dilutionFactor = stockConc / targetConc;

        const resultDiv = document.getElementById('dilution-result');
        resultDiv.innerHTML = `
            <h4><i class="fas fa-flask"></i> Dilution Protocol</h4>
            <div style="background: #10b981; color: white; padding: 1.5rem; border-radius: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div><strong>Stock Volume:</strong><br>${this.formatScientific(stockVol)} mL</div>
                    <div><strong>Diluent Volume:</strong><br>${this.formatScientific(diluentVol)} mL</div>
                </div>
                <div style="text-align: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.2); border-radius: 8px;">
                    <strong>Dilution Factor: ${this.formatScientific(dilutionFactor)}×</strong>
                </div>
            </div>
        `;
        resultDiv.classList.add('show');
    }

    // **UTILITY FUNCTIONS**
    parseScientificInput(input) {
        if (!input || typeof input !== 'string') return NaN;
        
        let cleanInput = input.trim()
            .replace(/×/g, '*')
            .replace(/\^/g, '**')
            .replace(/\s+/g, '')
            .toLowerCase();

        try {
            if (cleanInput.includes('e')) {
                return parseFloat(cleanInput);
            }
            
            if (cleanInput.includes('10**')) {
                const result = Function(`"use strict"; return (${cleanInput})`)();
                return typeof result === 'number' && isFinite(result) ? result : NaN;
            }
            
            const simpleNumber = parseFloat(cleanInput);
            return !isNaN(simpleNumber) ? simpleNumber : NaN;
        } catch {
            return NaN;
        }
    }

    formatScientific(number) {
        if (isNaN(number)) return 'Invalid';
        
        if (Math.abs(number) >= 1e6 || (Math.abs(number) < 1e-3 && number !== 0)) {
            return number.toExponential(2);
        } else if (Math.abs(number) >= 1000) {
            return number.toLocaleString();
        } else {
            return number.toPrecision(4);
        }
    }

    convertCFUToBase(value, unit) {
        return unit === 'CFU/µL' ? value * 1000 : value;
    }

    convertVolumeToBase(value, unit) {
        const conversions = { 'L': 1000, 'mL': 1, 'µL': 0.001 };
        return value * (conversions[unit] || 1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    updateStats() {
        const groups = this.getTags('groups-container');
        const timepoints = this.getTags('timepoints-container');
        const bioReps = parseInt(document.getElementById('bio-replicates').value) || 0;
        const techReps = parseInt(document.getElementById('tech-replicates').value) || 0;
        const includeControls = document.getElementById('include-controls').checked;
        const plateFormat = document.getElementById('plate-format').value;
        const config = this.plateConfigs[plateFormat];

        let wellsNeeded = groups.length * timepoints.length * bioReps * techReps;
        if (includeControls) {
            wellsNeeded += timepoints.length * bioReps * techReps * 2;
        }

        const wellsAvailable = config.rows * config.cols;
        const utilization = wellsAvailable > 0 ? (wellsNeeded / wellsAvailable * 100).toFixed(1) : 0;
        const totalSurface = (wellsNeeded * config.surfaceArea).toFixed(2);

        document.getElementById('wells-needed').textContent = wellsNeeded;
        document.getElementById('wells-available').textContent = wellsAvailable;
        document.getElementById('utilization').textContent = `${utilization}%`;
        document.getElementById('surface-area').textContent = totalSurface;
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

    updateLayoutCount() {
        this.layoutCount++;
        localStorage.setItem('layoutCount', this.layoutCount.toString());
        document.getElementById('total-layouts').textContent = this.layoutCount;
    }

    loadLayoutCount() {
        return parseInt(localStorage.getItem('layoutCount')) || 0;
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
}

// **EXPORT FUNCTIONS**
async function exportPlate(format) {
    if (app.currentLayout.length === 0) {
        app.showNotification('warning', 'No Layout', 'Please generate a plate layout first');
        return;
    }

    app.showLoading(`Exporting ${format.toUpperCase()}...`);

    try {
        switch (format) {
            case 'png':
                await exportAsPNG();
                break;
            case 'csv':
                exportAsCSV();
                break;
            case 'protocol':
                exportAsProtocol();
                break;
            case 'svg':
                app.showNotification('info', 'SVG Export', 'SVG export feature coming soon!');
                break;
        }
    } catch (error) {
        app.showNotification('error', 'Export Failed', error.message);
    } finally {
        app.hideLoading();
    }
}

async function exportAsPNG() {
    // Create export container
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        background: white;
        padding: 40px;
        font-family: 'Inter', sans-serif;
        width: 1000px;
    `;

    // Create header
    const expName = document.getElementById('experiment-name').value || 'Laboratory Experiment';
    const researcher = document.getElementById('researcher-name').value || 'Research Team';
    
    const header = document.createElement('div');
    header.style.cssText = `
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        border-bottom: 3px solid #2563eb;
        background: #f8fafc;
        border-radius: 12px;
    `;
    
    header.innerHTML = `
        <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">🧪 ${expName}</h1>
        <p style="font-size: 16px; color: #475569;">Researcher: ${researcher} | Generated: ${new Date().toLocaleDateString()}</p>
        <p style="font-size: 14px; color: #64748b;">PlateMaster Pro - Professional Laboratory Tool</p>
    `;

    // Clone plate visualization
    const plateClone = document.getElementById('plate-display').cloneNode(true);
    plateClone.style.transform = 'scale(1)';

    exportContainer.appendChild(header);
    exportContainer.appendChild(plateClone);
    document.body.appendChild(exportContainer);

    try {
        if (typeof html2canvas !== 'undefined') {
            const canvas = await html2canvas(exportContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: false
            });
            
            const link = document.createElement('a');
            link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_plate_layout.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            app.showNotification('success', 'Export Complete', 'High-quality PNG downloaded successfully');
        } else {
            app.showNotification('warning', 'Library Missing', 'html2canvas library not loaded');
        }
    } finally {
        document.body.removeChild(exportContainer);
    }
}

function exportAsCSV() {
    let csv = 'Well,Group,Timepoint,BioReplicate,TechReplicate,Type,Color\n';
    
    app.currentLayout.forEach(item => {
        csv += `"${item.well}","${item.group}","${item.timepoint}","${item.bioReplicate}","${item.techReplicate}","${item.type}","${item.color}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const expName = document.getElementById('experiment-name').value || 'plate-layout';
    link.download = `${expName.replace(/[^a-z0-9]/gi, '_')}_data.csv`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    app.showNotification('success', 'CSV Export Complete', 'Data exported successfully');
}

function exportAsProtocol() {
    const expName = document.getElementById('experiment-name').value || 'Laboratory Experiment';
    const researcher = document.getElementById('researcher-name').value || 'Research Team';
    const plateFormat = document.getElementById('plate-format').value;
    
    let protocol = `EXPERIMENTAL PROTOCOL\n`;
    protocol += `${'='.repeat(50)}\n\n`;
    protocol += `Experiment: ${expName}\n`;
    protocol += `Researcher: ${researcher}\n`;
    protocol += `Date: ${new Date().toLocaleDateString()}\n`;
    protocol += `Plate Format: ${plateFormat}-well\n`;
    protocol += `Wells Used: ${app.currentLayout.length}\n\n`;
    
    const uniqueGroups = [...new Set(app.currentLayout.map(item => item.group))];
    protocol += `TREATMENT GROUPS (${uniqueGroups.length}):\n`;
    protocol += `${'-'.repeat(30)}\n`;
    uniqueGroups.forEach((group, index) => {
        const groupWells = app.currentLayout.filter(item => item.group === group);
        protocol += `${index + 1}. ${group} (${groupWells.length} wells)\n`;
    });
    
    protocol += `\nWELL ASSIGNMENTS:\n`;
    protocol += `${'-'.repeat(30)}\n`;
    app.currentLayout.forEach(item => {
        protocol += `${item.well}: ${item.group} | ${item.timepoint} | Bio${item.bioReplicate} | Tech${item.techReplicate}\n`;
    });

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
    app.showNotification('success', 'Protocol Export Complete', 'Experimental protocol downloaded');
}

// Initialize the application
const app = new PlateMasterPro();

console.log('🧪 PlateMaster Pro - Professional Laboratory Tool Ready!');
