#!/bin/bash

# Directory structure for popovers
BASE_DIR="/Users/jimmeeygondaa/physique57-analytics-hub/public/popovers"

# Contexts and their display names
declare -A CONTEXTS=(
    ["executive-overview"]="Executive Overview"
    ["sales-overview"]="Sales Analytics" 
    ["funnel-leads-overview"]="Funnel & Leads"
    ["client-retention-overview"]="Client Retention"
    ["trainer-performance-overview"]="Trainer Performance"
    ["class-attendance-overview"]="Class Attendance"
    ["class-formats-overview"]="Class Formats"
    ["discounts-promotions-overview"]="Discounts & Promotions"
    ["sessions-overview"]="Sessions Analytics"
    ["outlier-analysis-overview"]="Outlier Analysis"
    ["expiration-analytics-overview"]="Expiration Analytics"
    ["late-cancellations-overview"]="Late Cancellations"
    ["patterns-trends-overview"]="Patterns & Trends"
)

# Locations and their details
declare -A LOCATIONS=(
    ["all"]="All Locations|#667eea|#764ba2|#ffd700"
    ["kwality"]="Kwality House|#ff6b6b|#feca57|#fff3cd"
    ["supreme"]="Supreme HQ|#4ecdc4|#44a08d|#e0f7fa"
    ["kenkere"]="Kenkere House|#a8e6cf|#88d8c0|#27ae60"
)

# Location icons
declare -A LOCATION_ICONS=(
    ["all"]="🌍"
    ["kwality"]="🏠"
    ["supreme"]="🏢"
    ["kenkere"]="🏛️"
)

# Sample metrics for each context
declare -A METRICS=(
    ["executive-overview"]="Total Revenue:\$89,420|Active Members:1,247 clients|Growth Rate:+14.2%"
    ["sales-overview"]="Monthly Revenue:\$47,250|New Acquisitions:89 clients|Conversion Rate:24.3%"
    ["funnel-leads-overview"]="Lead Conversion:18.7%|Pipeline Value:\$127,400|Active Leads:342"
    ["client-retention-overview"]="Retention Rate:87.2%|Churn Rate:4.8%|LTV:\$2,847"
    ["trainer-performance-overview"]="Top Performer:Sarah M|Avg Rating:4.8/5|Classes Taught:156"
    ["class-attendance-overview"]="Attendance Rate:89.3%|Peak Time:6:30 AM|Avg Class Size:12"
    ["class-formats-overview"]="Most Popular:Power Cycle|Utilization:82.5%|Formats:8 types"
    ["discounts-promotions-overview"]="Discount Impact:12.8%|Active Promotions:5|Savings:\$8,420"
    ["sessions-overview"]="Total Sessions:2,847|Completion Rate:94.6%|Avg Duration:52 mins"
    ["outlier-analysis-overview"]="Anomalies Detected:7|Revenue Impact:\$3,200|Alert Level:Medium"
    ["expiration-analytics-overview"]="Expiring Soon:84 packages|Value at Risk:\$12,600|Renewal Rate:76.3%"
    ["late-cancellations-overview"]="Cancellation Rate:8.2%|Revenue Lost:\$4,100|Peak Day:Friday"
    ["patterns-trends-overview"]="Trending Up:Morning Classes|Seasonal Pattern:+23%|Best Day:Monday"
)

# Function to generate HTML content
generate_html() {
    local context=$1
    local location=$2
    local context_name="${CONTEXTS[$context]}"
    local location_data="${LOCATIONS[$location]}"
    local location_name=$(echo "$location_data" | cut -d'|' -f1)
    local color1=$(echo "$location_data" | cut -d'|' -f2)
    local color2=$(echo "$location_data" | cut -d'|' -f3)
    local accent_color=$(echo "$location_data" | cut -d'|' -f4)
    local location_icon="${LOCATION_ICONS[$location]}"
    local metrics="${METRICS[$context]}"
    
    # Parse metrics
    local metric1=$(echo "$metrics" | cut -d'|' -f1)
    local metric2=$(echo "$metrics" | cut -d'|' -f2)
    local metric3=$(echo "$metrics" | cut -d'|' -f3)
    
    cat > "$BASE_DIR/$context/$location.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$context_name - $location_name</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, $color1 0%, $color2 100%);
            color: white;
            min-height: calc(100vh - 40px);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .info-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 1.1rem;
        }
        .value {
            font-weight: bold;
            color: $accent_color;
        }
        .note {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid $accent_color;
            padding: 15px;
            margin-top: 20px;
            border-radius: 0 10px 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>$location_icon $context_name</h1>
        <p style="text-align: center; font-size: 1.2rem; margin-bottom: 30px;">
            $location_name Analytics Dashboard
        </p>
        
        <div class="info-card">
            <h2>📊 Key Metrics</h2>
            <div class="metric">
                <span>$(echo "$metric1" | cut -d':' -f1):</span>
                <span class="value">$(echo "$metric1" | cut -d':' -f2)</span>
            </div>
            <div class="metric">
                <span>$(echo "$metric2" | cut -d':' -f1):</span>
                <span class="value">$(echo "$metric2" | cut -d':' -f2)</span>
            </div>
            <div class="metric">
                <span>$(echo "$metric3" | cut -d':' -f1):</span>
                <span class="value">$(echo "$metric3" | cut -d':' -f2)</span>
            </div>
        </div>

        <div class="info-card">
            <h2>📈 Performance Insights</h2>
            <div class="metric">
                <span>Location Rank:</span>
                <span class="value">#$(($RANDOM % 3 + 1)) of 3</span>
            </div>
            <div class="metric">
                <span>Trend Direction:</span>
                <span class="value">📈 Growing</span>
            </div>
            <div class="metric">
                <span>Last Updated:</span>
                <span class="value">Dec 9, 2025</span>
            </div>
        </div>

        <div class="note">
            <strong>💡 Insights:</strong> This $context_name dashboard provides comprehensive analytics for $location_name. Use the edit button to customize this content with your own insights and notes.
        </div>
    </div>
</body>
</html>
EOF
}

# Create all directories first
for context in "${!CONTEXTS[@]}"; do
    mkdir -p "$BASE_DIR/$context"
done

# Generate HTML files for all combinations
for context in "${!CONTEXTS[@]}"; do
    for location in "${!LOCATIONS[@]}"; do
        echo "Creating $context/$location.html..."
        generate_html "$context" "$location"
    done
done

echo "✅ Created $(ls $BASE_DIR/*/*.html | wc -l) HTML files across all contexts and locations!"