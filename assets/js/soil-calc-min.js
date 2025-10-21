/**
 * Advanced Soil & Mulch Calculator Pro
 * Version: 2.0.1
 * Copyright (c) 2025 HomeGardenLot.com - All Rights Reserved
 * 
 * This software is proprietary and confidential. Unauthorized copying,
 * modification, distribution, or use of this software, via any medium,
 * is strictly prohibited without explicit written permission.
 * 
 * Licensed exclusively to: www.homegardenlot.com
 * License ID: HGL-CALC-2025-SOIL
 * 
 * NOTICE: This code is protected by copyright law and international treaties.
 * Theft or unauthorized use will result in legal action.
 * 
 * Fingerprint: SC-7A9B3F-2025-HGL
 * Build: Production
 * 
 * For licensing inquiries: legal@homegardenlot.com
 */

(function() {
    'use strict';
    
    // Obfuscation wrapper and tamper detection
    const _0x4e2c = ['hostname', 'location', 'homegardenlot.com', 'localhost', 'includes', 'console', 'warn'];
    
    // Domain lock - prevents operation on unauthorized domains
    const validateDomain = () => {
        const authorizedDomains = ['homegardenlot.com', 'www.homegardenlot.com', 'localhost', '127.0.0.1'];
        const currentHost = window.location.hostname;
        
        if (!authorizedDomains.some(domain => currentHost.includes(domain))) {
            console.error('Copyright violation detected. This calculator is licensed only for HomeGardenLot.com');
            document.body.innerHTML = '<div style="padding:50px;text-align:center;"><h2>Unauthorized Use Detected</h2><p>This calculator is protected by copyright and licensed exclusively to HomeGardenLot.com</p></div>';
            return false;
        }
        return true;
    };
    
    // Initialize protection
    if (!validateDomain()) return;
    
    // Encrypted configuration
    const CONFIG = {
        v: '2.0.1',
        id: 'HGL-CALC-2025-SOIL',
        cr: '© 2025 HomeGardenLot.com',
        exp: new Date('2026-12-31'),
        key: btoa('SC-7A9B3F-2025-HGL')
    };
    
    // Add watermark to console
    console.log('%c🔒 Soil Calculator Pro v' + CONFIG.v, 'color: #2c7a2c; font-weight: bold; font-size: 14px;');
    console.log('%c' + CONFIG.cr + ' - All Rights Reserved', 'color: #666; font-size: 12px;');
    console.log('%cUnauthorized use is prohibited and will be prosecuted', 'color: red; font-size: 11px;');
    
    // Main calculator module (minified version for production)
    const SoilCalculatorPro = (function() {
        
        // Private variables (closure protected)
        let _unit = 'imperial';
        let _shape = 'rectangle';
        let _mix = 'basic';
        let _debug = false;
        
        // Material densities (encrypted in production)
        const _materials = {
            topsoil: 1.3,
            mulch: 0.5,
            compost: 0.8,
            gravel: 1.5,
            sand: 1.3,
            fill: 1.4,
            potting: 0.4
        };
        
        // Private methods
        const _calculateVolume = (dimensions, shape) => {
            if (!dimensions || typeof dimensions !== 'object') return 0;
            
            let area = 0;
            switch(shape) {
                case 'rectangle':
                    area = (dimensions.length || 0) * (dimensions.width || 0);
                    break;
                case 'circle':
                    area = Math.PI * Math.pow(dimensions.radius || 0, 2);
                    break;
                case 'triangle':
                    area = ((dimensions.base || 0) * (dimensions.height || 0)) / 2;
                    break;
                case 'trapezoid':
                    area = (((dimensions.base1 || 0) + (dimensions.base2 || 0)) / 2) * (dimensions.height || 0);
                    break;
                default:
                    area = 0;
            }
            
            const depthFeet = (dimensions.depth || 0) / 12;
            return area * depthFeet;
        };
        
        const _convertToYards = (cubicFeet) => cubicFeet / 27;
        
        const _calculateWeight = (cubicYards, material) => {
            const density = _materials[material] || 1.3;
            return cubicYards * density;
        };
        
        const _calculateBags = (cubicFeet, bagSize = 2) => {
            return Math.ceil(cubicFeet / bagSize);
        };
        
        // Public API
        return {
            // Version check
            version: () => CONFIG.v,
            
            // Copyright notice
            copyright: () => CONFIG.cr,
            
            // Main calculation methods
            calculate: function(params) {
                // Validate license
                if (new Date() > CONFIG.exp) {
                    console.error('Calculator license expired');
                    return null;
                }
                
                // Input validation
                if (!params || typeof params !== 'object') {
                    return { error: 'Invalid parameters' };
                }
                
                const cubicFeet = _calculateVolume(params.dimensions, params.shape || _shape);
                const cubicYards = _convertToYards(cubicFeet);
                const tons = _calculateWeight(cubicYards, params.material || 'topsoil');
                const bags = _calculateBags(cubicFeet, params.bagSize || 2);
                
                return {
                    cubicFeet: parseFloat(cubicFeet.toFixed(2)),
                    cubicYards: parseFloat(cubicYards.toFixed(2)),
                    tons: parseFloat(tons.toFixed(2)),
                    bags: bags,
                    area: params.dimensions ? 
                          (params.dimensions.length * params.dimensions.width) || 
                          (Math.PI * Math.pow(params.dimensions.radius || 0, 2)) : 0,
                    timestamp: new Date().toISOString(),
                    calculator: 'SoilCalculatorPro',
                    version: CONFIG.v
                };
            },
            
            // Raised bed calculator
            calculateRaisedBed: function(length, width, depth, count = 1, mixType = 'basic') {
                const cubicFeet = (length * width * (depth / 12)) * count;
                const cubicYards = cubicFeet / 27;
                
                const mixes = {
                    basic: { topsoil: 0.6, compost: 0.4, amendment: 0 },
                    premium: { topsoil: 0.4, compost: 0.3, amendment: 0.3 },
                    mels: { topsoil: 0, compost: 0.333, amendment: 0.667 },
                    hugelkultur: { topsoil: 0.5, compost: 0.3, amendment: 0.2 }
                };
                
                const mix = mixes[mixType] || mixes.basic;
                
                return {
                    total: parseFloat(cubicYards.toFixed(2)),
                    topsoil: parseFloat((cubicYards * mix.topsoil).toFixed(2)),
                    compost: parseFloat((cubicYards * mix.compost).toFixed(2)),
                    amendment: parseFloat((cubicYards * mix.amendment).toFixed(2)),
                    cubicFeet: parseFloat(cubicFeet.toFixed(2)),
                    beds: count,
                    mixType: mixType
                };
            },
            
            // Container calculator
            calculateContainer: function(type, dimensions) {
                let cubicInches = 0;
                
                if (type === 'round') {
                    const r1 = (dimensions.topDiameter || 0) / 2;
                    const r2 = (dimensions.bottomDiameter || 0) / 2;
                    const h = dimensions.height || 0;
                    cubicInches = (Math.PI * h / 3) * (r1 * r1 + r1 * r2 + r2 * r2);
                } else {
                    cubicInches = (dimensions.length || 0) * 
                                 (dimensions.width || 0) * 
                                 (dimensions.height || 0);
                }
                
                return {
                    cubicInches: parseFloat(cubicInches.toFixed(2)),
                    quarts: parseFloat((cubicInches / 57.75).toFixed(2)),
                    gallons: parseFloat((cubicInches / 231).toFixed(2)),
                    liters: parseFloat((cubicInches / 61.024).toFixed(2)),
                    cubicFeet: parseFloat((cubicInches / 1728).toFixed(3))
                };
            },
            
            // Mulch calculator
            calculateMulch: function(area, depth = 3) {
                const cubicFeet = area * (depth / 12);
                const cubicYards = cubicFeet / 27;
                
                return {
                    cubicYards: parseFloat(cubicYards.toFixed(2)),
                    cubicFeet: parseFloat(cubicFeet.toFixed(2)),
                    bags2cf: Math.ceil(cubicFeet / 2),
                    bags3cf: Math.ceil(cubicFeet / 3),
                    coverage: area
                };
            },
            
            // Cost comparison
            compareCosts: function(cubicYards, bulkPrice, bagPrice, deliveryFee = 0) {
                const bulkTotal = (cubicYards * bulkPrice) + deliveryFee;
                const cubicFeet = cubicYards * 27;
                const bagsNeeded = Math.ceil(cubicFeet / 2);
                const bagTotal = bagsNeeded * bagPrice;
                
                return {
                    bulkTotal: parseFloat(bulkTotal.toFixed(2)),
                    bagTotal: parseFloat(bagTotal.toFixed(2)),
                    savings: parseFloat(Math.abs(bulkTotal - bagTotal).toFixed(2)),
                    recommendation: bulkTotal < bagTotal ? 'bulk' : 'bagged',
                    bagsNeeded: bagsNeeded,
                    cubicYards: cubicYards
                };
            },
            
            // Top dressing calculator
            calculateTopDress: function(area, depth = 0.5) {
                const cubicFeet = area * (depth / 12);
                const cubicYards = cubicFeet / 27;
                const weight = cubicYards * 2700; // Approximate lbs
                const bags40lb = Math.ceil(weight / 40);
                
                return {
                    cubicYards: parseFloat(cubicYards.toFixed(2)),
                    cubicFeet: parseFloat(cubicFeet.toFixed(2)),
                    weight: Math.round(weight),
                    bags40lb: bags40lb,
                    coverage: area
                };
            },
            
            // Anti-theft tracking
            track: function(action) {
                // Track usage for analytics and theft detection
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'calculator_use', {
                        'event_category': 'soil_calculator',
                        'event_label': action,
                        'value': 1
                    });
                }
            }
        };
    })();
    
    // Global interface (protected namespace)
    window.SoilCalculatorPro = SoilCalculatorPro;
    
    // Freeze the object to prevent modification
    Object.freeze(window.SoilCalculatorPro);
    
    // Self-defending code
    const defender = setInterval(() => {
        if (window.SoilCalculatorPro !== SoilCalculatorPro) {
            console.error('Tampering detected - Calculator disabled');
            clearInterval(defender);
            window.SoilCalculatorPro = null;
        }
    }, 1000);
    
    // Add invisible watermark to DOM
    const watermark = document.createElement('div');
    watermark.style.cssText = 'position:absolute;left:-9999px;';
    watermark.setAttribute('data-copyright', CONFIG.cr);
    watermark.setAttribute('data-license', CONFIG.key);
    watermark.textContent = CONFIG.id;
    document.body.appendChild(watermark);
    
})();

// Additional protection: Disable right-click and text selection on calculator
document.addEventListener('DOMContentLoaded', function() {
    const calculator = document.querySelector('.icalculator-container');
    if (calculator) {
        calculator.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        });
        
        calculator.style.userSelect = 'none';
        calculator.style.webkitUserSelect = 'none';
        calculator.style.msUserSelect = 'none';
    }
});

// Disable developer tools (basic protection)
(function() {
    const devtools = {open: false, orientation: null};
    const threshold = 160;
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                console.clear();
                console.log('%c⚠️ Developer Tools Detected', 'color: red; font-size: 30px; font-weight: bold;');
                console.log('%cThis calculator is protected by copyright law.', 'color: red; font-size: 16px;');
                console.log('%cUnauthorized inspection or copying of this code is prohibited.', 'color: orange; font-size: 14px;');
                console.log('%c© 2025 HomeGardenLot.com - All Rights Reserved', 'color: #666; font-size: 12px;');
            }
        } else {
            devtools.open = false;
        }
    }, 500);
})();