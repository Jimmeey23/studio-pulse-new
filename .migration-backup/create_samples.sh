#!/bin/bash
cd /Users/jimmeeygondaa/physique57-analytics-hub/public/popovers

# Function to create HTML file
create_html() {
    local context="$1"
    local location="$2"
    local title="$3"
    local icon="$4"
    local bg_color1="$5"
    local bg_color2="$6"
    local accent_color="$7"
    local text_color="${8:-white}"
    local metric1_label="$9"
    local metric1_value="${10}"
    local metric2_label="${11}"
    local metric2_value="${12}"
    local metric3_label="${13}"
    local metric3_value="${14}"
    local insight="${15}"

    cat > "$context/$location.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, $bg_color1 0%, $bg_color2 100%);
            color: $text_color;
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
        .insight {
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
        <h1>$icon $title</h1>
        <div class="info-card">
            <h2>📊 Key Metrics</h2>
            <div class="metric">
                <span>$metric1_label:</span>
                <span class="value">$metric1_value</span>
            </div>
            <div class="metric">
                <span>$metric2_label:</span>
                <span class="value">$metric2_value</span>
            </div>
            <div class="metric">
                <span>$metric3_label:</span>
                <span class="value">$metric3_value</span>
            </div>
        </div>
        <div class="insight">
            <strong>💡 Insights:</strong> $insight
        </div>
    </div>
</body>
</html>
EOF
}

# Funnel Leads Overview files
create_html "funnel-leads-overview" "all" "Funnel & Leads - All Locations" "🔄" "#667eea" "#764ba2" "#ffd700" "white" \
    "Total Leads" "892 leads" "Conversion Rate" "18.7%" "Pipeline Value" "\$127,400" \
    "Strong lead pipeline across all locations. Focus on improving lead qualification to boost conversion rates."

create_html "funnel-leads-overview" "kwality" "Funnel & Leads - Kwality House" "🔄" "#ff6b6b" "#feca57" "#fff3cd" "white" \
    "Monthly Leads" "387 leads" "Conversion Rate" "22.1%" "Pipeline Value" "\$68,200" \
    "Kwality House shows strong lead conversion. Optimize follow-up processes to maintain momentum."

create_html "funnel-leads-overview" "supreme" "Funnel & Leads - Supreme HQ" "🔄" "#4ecdc4" "#44a08d" "#e0f7fa" "white" \
    "Monthly Leads" "285 leads" "Conversion Rate" "16.8%" "Pipeline Value" "\$38,900" \
    "Supreme HQ has room for improvement in lead conversion. Consider enhanced nurturing campaigns."

create_html "funnel-leads-overview" "kenkere" "Funnel & Leads - Kenkere House" "🔄" "#a8e6cf" "#88d8c0" "#27ae60" "#2c3e50" \
    "Monthly Leads" "220 leads" "Conversion Rate" "15.2%" "Pipeline Value" "\$20,300" \
    "Emerging market with growth potential. Invest in local lead generation and community outreach."

# Client Retention Overview files
create_html "client-retention-overview" "all" "Client Retention - All Locations" "👥" "#667eea" "#764ba2" "#ffd700" "white" \
    "Retention Rate" "87.2%" "Churn Rate" "4.8%" "Avg LTV" "\$2,847" \
    "Strong overall retention metrics. Focus on at-risk segments to further reduce churn."

create_html "client-retention-overview" "kwality" "Client Retention - Kwality House" "👥" "#ff6b6b" "#feca57" "#fff3cd" "white" \
    "Retention Rate" "91.2%" "Churn Rate" "3.1%" "Avg LTV" "\$3,240" \
    "Excellent retention performance. Kwality House sets the benchmark for client satisfaction."

create_html "client-retention-overview" "supreme" "Client Retention - Supreme HQ" "👥" "#4ecdc4" "#44a08d" "#e0f7fa" "white" \
    "Retention Rate" "88.7%" "Churn Rate" "4.2%" "Avg LTV" "\$2,890" \
    "Solid retention metrics with opportunity to reach Kwality House levels through enhanced engagement."

create_html "client-retention-overview" "kenkere" "Client Retention - Kenkere House" "👥" "#a8e6cf" "#88d8c0" "#27ae60" "#2c3e50" \
    "Retention Rate" "84.3%" "Churn Rate" "6.8%" "Avg LTV" "\$2,410" \
    "Building retention foundation. Focus on onboarding excellence and community building."

# Trainer Performance Overview files  
create_html "trainer-performance-overview" "all" "Trainer Performance - All Locations" "🏃" "#667eea" "#764ba2" "#ffd700" "white" \
    "Top Performer" "Sarah Martinez" "Avg Rating" "4.8/5" "Classes Taught" "892" \
    "Strong trainer performance across the board. Implement peer mentoring for continuous improvement."

create_html "trainer-performance-overview" "kwality" "Trainer Performance - Kwality House" "🏃" "#ff6b6b" "#feca57" "#fff3cd" "white" \
    "Top Performer" "Sarah Martinez" "Avg Rating" "4.9/5" "Classes Taught" "425" \
    "Exceptional trainer quality at Kwality House. Use as training center for new instructor development."

create_html "trainer-performance-overview" "supreme" "Trainer Performance - Supreme HQ" "🏃" "#4ecdc4" "#44a08d" "#e0f7fa" "white" \
    "Top Performer" "Michael Chen" "Avg Rating" "4.7/5" "Classes Taught" "298" \
    "Strong performance with room for growth. Cross-training with Kwality House team recommended."

create_html "trainer-performance-overview" "kenkere" "Trainer Performance - Kenkere House" "🏃" "#a8e6cf" "#88d8c0" "#27ae60" "#2c3e50" \
    "Top Performer" "Priya Sharma" "Avg Rating" "4.6/5" "Classes Taught" "169" \
    "Building strong local trainer talent. Invest in advanced certification and skill development."

echo "✅ Created sample HTML files for multiple contexts and locations!"