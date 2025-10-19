        // Global variables
        let currentUnit = 'imperial';
        let currentShape = 'rectangle';
        let currentMix = 'basic';

        // Material densities (tons per cubic yard)
        const materialDensities = {
            topsoil: 1.3,
            mulch: 0.5,
            compost: 0.8,
            gravel: 1.5,
            sand: 1.3,
            fill: 1.4,
            potting: 0.4
        };

        // Switch tabs
        function switchTab(tab) {
            // Hide all sections
            document.querySelectorAll('.icalc-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active from all tabs
            document.querySelectorAll('.itab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(`${tab}-section`).classList.add('active');
            
            // Mark tab as active
            event.target.classList.add('active');
        }

        // Switch unit system
        function switchUnit(unit) {
            currentUnit = unit;
            document.querySelectorAll('.iunit-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update labels based on unit
            if (unit === 'metric') {
                updateLabelsToMetric();
            } else {
                updateLabelsToImperial();
            }
        }

        // Select shape
        function selectShape(shape) {
            currentShape = shape;
            
            // Update active shape button
            document.querySelectorAll('.ishape-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-shape="${shape}"]`).classList.add('active');
            
            // Hide all shape inputs
            document.querySelectorAll('.shape-inputs').forEach(inputs => {
                inputs.style.display = 'none';
            });
            
            // Show selected shape inputs
            document.getElementById(`${shape}-inputs`).style.display = 'block';
        }

        // Calculate basic section
        function calculateBasic() {
            let area = 0;
            let depth = parseFloat(document.getElementById('basic-depth').value) || 0;
            
            // Calculate area based on shape
            switch(currentShape) {
                case 'rectangle':
                    const length = parseFloat(document.getElementById('rect-length').value) || 0;
                    const width = parseFloat(document.getElementById('rect-width').value) || 0;
                    area = length * width;
                    break;
                    
                case 'circle':
                    const radius = parseFloat(document.getElementById('circle-radius').value) || 0;
                    area = Math.PI * radius * radius;
                    break;
                    
                case 'triangle':
                    const base = parseFloat(document.getElementById('tri-base').value) || 0;
                    const height = parseFloat(document.getElementById('tri-height').value) || 0;
                    area = (base * height) / 2;
                    break;
                    
                case 'trapezoid':
                    const base1 = parseFloat(document.getElementById('trap-base1').value) || 0;
                    const base2 = parseFloat(document.getElementById('trap-base2').value) || 0;
                    const trapHeight = parseFloat(document.getElementById('trap-height').value) || 0;
                    area = ((base1 + base2) / 2) * trapHeight;
                    break;
            }
            
            // Convert depth from inches to feet
            const depthFeet = depth / 12;
            
            // Calculate volume in cubic feet
            const cubicFeet = area * depthFeet;
            
            // Convert to cubic yards
            const cubicYards = cubicFeet / 27;
            
            // Get material type for weight calculation
            const materialType = document.getElementById('material-type').value;
            const density = materialDensities[materialType];
            const tons = cubicYards * density;
            
            // Calculate bags (assuming 2 cu ft bags)
            const bags = Math.ceil(cubicFeet / 2);
            
            // Display results
            document.getElementById('basic-yards').textContent = cubicYards.toFixed(2);
            document.getElementById('basic-feet').textContent = cubicFeet.toFixed(1);
            document.getElementById('basic-tons').textContent = tons.toFixed(2);
            document.getElementById('basic-bags').textContent = bags;
            document.getElementById('basic-coverage').textContent = area.toFixed(1);
            
            // Show results
            document.getElementById('basic-results').classList.add('show');
        }

        // Calculate raised bed
        function calculateRaisedBed() {
            const length = parseFloat(document.getElementById('bed-length').value) || 0;
            const width = parseFloat(document.getElementById('bed-width').value) || 0;
            const depth = parseFloat(document.getElementById('bed-depth').value) || 0;
            const count = parseFloat(document.getElementById('bed-count').value) || 1;
            
            // Calculate volume in cubic feet
            const cubicFeet = (length * width * (depth / 12)) * count;
            const cubicYards = cubicFeet / 27;
            
            // Calculate mix components based on selected mix
            let topsoil = 0, compost = 0, amendment = 0;
            
            switch(currentMix) {
                case 'basic':
                    topsoil = cubicYards * 0.6;
                    compost = cubicYards * 0.4;
                    break;
                case 'premium':
                    topsoil = cubicYards * 0.4;
                    compost = cubicYards * 0.3;
                    amendment = cubicYards * 0.3;
                    break;
                case 'mels':
                    topsoil = 0;
                    compost = cubicYards * 0.333;
                    amendment = cubicYards * 0.667;
                    break;
                case 'hugelkultur':
                    topsoil = cubicYards * 0.5;
                    compost = cubicYards * 0.3;
                    amendment = cubicYards * 0.2;
                    break;
            }
            
            // Display results
            document.getElementById('raised-total').textContent = cubicYards.toFixed(2);
            document.getElementById('raised-topsoil').textContent = topsoil.toFixed(2);
            document.getElementById('raised-compost').textContent = compost.toFixed(2);
            document.getElementById('raised-amendment').textContent = amendment.toFixed(2);
            
            document.getElementById('raised-results').classList.add('show');
        }

        // Calculate container
        function calculateContainer(type) {
            let cubicInches = 0;
            
            if (type === 'round') {
                const topDiam = parseFloat(document.getElementById('pot-diameter-top').value) || 0;
                const bottomDiam = parseFloat(document.getElementById('pot-diameter-bottom').value) || 0;
                const height = parseFloat(document.getElementById('pot-height').value) || 0;
                
                // Truncated cone formula
                const r1 = topDiam / 2;
                const r2 = bottomDiam / 2;
                cubicInches = (Math.PI * height / 3) * (r1 * r1 + r1 * r2 + r2 * r2);
                
            } else {
                const length = parseFloat(document.getElementById('rect-pot-length').value) || 0;
                const width = parseFloat(document.getElementById('rect-pot-width').value) || 0;
                const height = parseFloat(document.getElementById('rect-pot-height').value) || 0;
                
                cubicInches = length * width * height;
            }
            
            // Convert to various units
            const quarts = cubicInches / 57.75;
            const gallons = quarts / 4;
            const liters = quarts * 0.946;
            const cubicFeet = cubicInches / 1728;
            
            // Display results
            document.getElementById('container-quarts').textContent = quarts.toFixed(1);
            document.getElementById('container-gallons').textContent = gallons.toFixed(1);
            document.getElementById('container-liters').textContent = liters.toFixed(1);
            document.getElementById('container-cubic').textContent = cubicFeet.toFixed(2);
            
            document.getElementById('container-results').classList.add('show');
        }

        // Calculate mulch
        function calculateMulch() {
            const area = parseFloat(document.getElementById('mulch-area').value) || 0;
            const depth = parseFloat(document.getElementById('mulch-depth').value) || 3;
            
            // Calculate volume
            const cubicFeet = area * (depth / 12);
            const cubicYards = cubicFeet / 27;
            
            // Calculate bags
            const bags2cf = Math.ceil(cubicFeet / 2);
            const bags3cf = Math.ceil(cubicFeet / 3);
            
            // Display results
            document.getElementById('mulch-yards').textContent = cubicYards.toFixed(2);
            document.getElementById('mulch-bags-2').textContent = bags2cf;
            document.getElementById('mulch-bags-3').textContent = bags3cf;
            document.getElementById('mulch-coverage').textContent = area;
            
            document.getElementById('mulch-results').classList.add('show');
        }

        // Calculate cost comparison
        function calculateCost() {
            const yards = parseFloat(document.getElementById('bulk-yards').value) || 0;
            const bulkPrice = parseFloat(document.getElementById('bulk-price').value) || 0;
            const bagPrice = parseFloat(document.getElementById('bag-price').value) || 0;
            const delivery = parseFloat(document.getElementById('delivery-fee').value) || 0;
            
            // Calculate costs
            const bulkTotal = (yards * bulkPrice) + delivery;
            const cubicFeet = yards * 27;
            const bagsNeeded = Math.ceil(cubicFeet / 2);
            const bagTotal = bagsNeeded * bagPrice;
            
            const savings = Math.abs(bulkTotal - bagTotal);
            const bestOption = bulkTotal < bagTotal ? 'Bulk Delivery' : 'Bagged';
            
            // Display results
            document.getElementById('bulk-total').textContent = bulkTotal.toFixed(2);
            document.getElementById('bag-total').textContent = bagTotal.toFixed(2);
            document.getElementById('cost-savings').textContent = savings.toFixed(2);
            document.getElementById('best-option').textContent = bestOption;
            
            document.getElementById('cost-results').classList.add('show');
        }

        // Calculate top dressing
        function calculateTopDress() {
            const area = parseFloat(document.getElementById('lawn-area').value) || 0;
            const depth = parseFloat(document.getElementById('topdress-depth').value) || 0.5;
            
            // Calculate volume
            const cubicFeet = area * (depth / 12);
            const cubicYards = cubicFeet / 27;
            
            // Calculate weight and bags (40lb bags, approx 0.75 cu ft each)
            const weight = cubicYards * 2700; // Approximate weight in lbs
            const bags = Math.ceil(cubicFeet / 0.75);
            
            // Display results
            document.getElementById('topdress-yards').textContent = cubicYards.toFixed(2);
            document.getElementById('topdress-coverage').textContent = area;
            document.getElementById('topdress-bags').textContent = bags;
            document.getElementById('topdress-weight').textContent = weight.toFixed(0);
            
            document.getElementById('topdress-results').classList.add('show');
        }

        // Helper functions for quick depth selection
        function setMulchDepth(depth) {
            document.getElementById('mulch-depth').value = depth;
        }

        function setTopDressDepth(depth) {
            document.getElementById('topdress-depth').value = depth;
        }

        function setSoilMix(mix) {
            currentMix = mix;
            // Visual feedback
            document.querySelectorAll('.idepth-btn').forEach(btn => {
                btn.style.background = 'white';
            });
            event.target.style.background = 'var(--primary)';
            event.target.style.color = 'white';
        }

        // Update labels for metric system
        function updateLabelsToMetric() {
            // This would update all labels to metric units
            // Implementation depends on specific requirements
        }

        function updateLabelsToImperial() {
            // Reset labels to imperial units
            // Implementation depends on specific requirements
        }

        // Add event listeners for Enter key on inputs
        document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('input[type="number"]');
            inputs.forEach(input => {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        // Find and click the nearest calculate button
                        const btn = this.closest('.icalc-card').querySelector('.icalc-btn');
                        if (btn) btn.click();
                    }
                });
            });
        });
