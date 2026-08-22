import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'te' | 'hi';


export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Brand & Top Header
    'app.title': 'ClearSpend',
    'app.tagline': 'AI Expense Tracker & Money Coach',
    'header.ai_coach': 'AI Coach',
    'header.review': 'Review',
    'header.finai': 'FinAI',

    // Navigation Tabs
    'nav.overview': 'Overview',
    'nav.ledger': 'Ledger',
    'nav.budgets': 'Budgets',
    'nav.finai': 'FinAI',
    'nav.review': 'Review',
    'nav.accounts': 'Accounts',
    'nav.compounding': 'Wealth Growth',

    // Dashboard
    'dash.financial_velocity': 'Financial Velocity & Cash Flow',
    'dash.spent': 'Spent this month',
    'dash.income': 'Income',
    'dash.net_savings': 'Net Savings',
    'dash.savings_rate': 'Savings Rate',
    'dash.daily_burn': 'Daily Burn Rate',
    'dash.accounts_title': 'Accounts & Liquid Assets',
    'dash.ask_finai': 'Ask FinAI Copilot',
    'dash.finai_prompt_sample': '"How can I cut ₹5,000 off my food spend this month?"',
    'dash.compounding_card_title': 'Power of Compounding: Small Spends to Wealth',
    'dash.compounding_card_desc': 'See how redirecting ₹2,000/month of discretionary spend can grow to ₹20+ Lakhs!',
    'dash.compounding_btn': 'Calculate Wealth Potential',
    'dash.spending_trend': 'Spending Pace & Cash Flow Trend',
    'dash.daily': 'Daily',
    'dash.cumulative': 'Cumulative',
    'dash.category_breakdown': 'Category Allocation',
    'dash.budget_speedometer': 'Budget Speedometers',
    'dash.recent_transactions': 'Recent Activity',
    'dash.view_all': 'View all',
    'dash.fix_ledger': 'Fix Ledger',

    // Quick Add
    'quickadd.placeholder': 'Try "380 zomato from hdfc" or "2k rent yesterday"…',
    'quickadd.log_btn': 'Log',
    'quickadd.listening': 'Listening to your voice…',
    'quickadd.quick_pills_food': '380 Zomato',
    'quickadd.quick_pills_groceries': '450 Zepto',
    'quickadd.quick_pills_fuel': '500 Petrol',
    'quickadd.quick_pills_uber': '220 Uber',

    // FinAI Chatbot
    'finai.title': 'FinAI Copilot',
    'finai.gemini_active': 'Gemini 2.5 Active',
    'finai.subtitle': 'Personal financial intelligence grounded in your real spending data',
    'finai.custom_key': 'Custom API Key',
    'finai.key_set': 'API Key Set',
    'finai.clear_chat': 'Clear Chat',
    'finai.input_placeholder': 'Ask FinAI: "How much on Zomato?" or "What if I invest ₹2000 monthly?"…',
    'finai.crunching': 'FinAI is analyzing your numbers…',

    // Compounding Calculator
    'compound.title': 'Power of Compounding Visualizer',
    'compound.subtitle': 'Discover the massive opportunity cost of small, recurring discretionary expenses',
    'compound.monthly_amount': 'Monthly Saved / Avoidable Amount',
    'compound.investment_period': 'Time Horizon (Years)',
    'compound.expected_cagr': 'Expected Annual Return (CAGR %)',
    'compound.total_invested': 'Total Invested Capital',
    'compound.estimated_wealth': 'Estimated Wealth (Compounded)',
    'compound.wealth_gain': 'Wealth Created from Returns',
    'compound.multiplication_factor': 'Compounding Multiplier',
    'compound.presets_title': 'Common Discretionary Habits & Their 20-Year Value',
    'compound.preset_coffee': '☕ Daily Coffee/Tea (₹100/day = ₹3,000/mo)',
    'compound.preset_swiggy': '🍔 Weekend Deliveries (₹2,000/mo)',
    'compound.preset_sub': '📺 Unused Subscriptions (₹1,000/mo)',
    'compound.preset_party': '🎉 Dining Out (₹5,000/mo)',
    'compound.ten_yr_val': 'In 10 Years',
    'compound.twenty_yr_val': 'In 20 Years',
    'compound.thirty_yr_val': 'In 30 Years',

    // Settings & Account
    'settings.title': 'Settings & Preferences',
    'settings.appearance': 'Appearance & Theme',
    'settings.theme_light': 'Light Mode',
    'settings.theme_dark': 'Dark Mode',
    'settings.theme_system': 'System Auto',
    'settings.language_title': 'App Language / భాష / भाषा',
    'settings.currency_title': 'Base Currency',
    'settings.accounts_title': 'Wallets & Accounts',
    'settings.categories_title': 'Expense Categories',
    'settings.rules_title': 'Learned Category Rules',
    'settings.data_title': 'Data Management',
    'settings.export_csv': 'Export All Data (CSV)',
    'settings.reset_demo': 'Reset to 40+ Demo Transactions',
    'settings.sign_out': 'Sign Out',
    'settings.llm_title': 'FinAI & LLM Engine',

    // Family Finance (Phase 8)
    'family.room_title': 'Family Finance Room',
    'family.scope_my_money': 'My Money',
    'family.scope_family': 'Family',
    'family.joint_envelopes': 'Shared Envelopes',
    'family.joint_goals': 'Joint Goals',
    'family.ask_family_ai': 'Ask Family AI',
    'family.fair_share': 'Fair Share & Household Contribution',
    'family.partner_preview': 'Preview What Partner Sees',
    'family.combined_income': 'Combined Income',
    'family.combined_outflow': 'Combined Outflow',
    'family.combined_savings': 'Combined Savings',
    'family.together': 'Together',
    'family.just_me': 'Just Me',
    'family.members_privacy': 'Members & Privacy Controls',
    'family.invite_partner': 'Invite Partner',
    'family.leave_room': 'Leave Household',
    'family.trial_active': 'Trial Active',
    'family.add_envelope': 'Add Shared Envelope',
    'family.new_goal': 'New Joint Goal',

    // Safe to Spend & Streaks
    'safe.title': 'Safe-to-Spend Today',
    'safe.daily_allowance': 'Daily Allowance',
    'safe.how_calculated': 'How is this calculated?',
    'safe.on_track': 'On track to save this month 🎉',
    'safe.overspending': 'Pacing high — consider trimming spend ⚠️',
    'streaks.title': 'Expense Logging Streak',
    'streaks.days_active': 'Days Active',
    'streaks.no_spend_btn': 'No spend today 🎉',
    'streaks.logged_today': 'Logged Today ✨',

    // Budgets & Committed Money
    'budgets.committed_title': 'Committed vs Free Money (50/30/20)',
    'budgets.fixed_needs': 'Fixed Commitments & Rent',
    'budgets.savings_goals': 'Reserved Savings Goals',
    'budgets.free_money': 'True Flexible Free Money',
    'budgets.add_envelope': 'Add Envelope',
    'budgets.pacing_simulator': 'Interactive Pacing Simulator',

    // Ledger & History
    'ledger.search_placeholder': 'Search by merchant, note, amount…',
    'ledger.all_months': 'All Months',
    'ledger.all_categories': 'All Categories',
    'ledger.all_wallets': 'All Wallets',
    'ledger.all_types': 'All Types',
    'ledger.import_csv': 'Import CSV',
    'ledger.export_csv': 'Export CSV',
    'ledger.no_txns': 'No transactions match your filters',

    // Auth
    'auth.hero_title': 'Autonomous AI Expense Tracker & Wealth Coach',
    'auth.signin_tab': 'Sign In',
    'auth.signup_tab': 'Sign Up',
    'auth.demo_tab': '⚡ Demo Sandbox',
    'auth.email_label': 'Email Address',
    'auth.password_label': 'Password',
    'auth.name_label': 'Your Full Name',
    'auth.signin_btn': 'Sign In with Email',
    'auth.signup_btn': 'Create Account',
    'auth.google_btn': 'Continue with Google',
    'auth.demo_launch_btn': 'Launch Interactive Demo Sandbox',
    'auth.security_ssl': '256-Bit SSL',
    'auth.security_rls': 'Supabase / Firebase Security',
    'auth.security_privacy': 'Zero Data Resale',
  },

  te: {
    // Brand & Top Header (తెలుగు)
    'app.title': 'క్లియర్‌స్పెండ్',
    'app.tagline': 'ఏఐ ఖర్చుల ట్రాకర్ & వెల్త్ కోచ్',
    'header.ai_coach': 'ఏఐ కోచ్',
    'header.review': 'రివ్యూ',
    'header.finai': 'ఫిన్‌ఏఐ',

    // Navigation Tabs
    'nav.overview': 'ఓవర్‌వ్యూ',
    'nav.ledger': 'లావాదేవీలు',
    'nav.budgets': 'బడ్జెట్‌లు',
    'nav.finai': 'ఫిన్‌ఏఐ చాట్',
    'nav.review': 'రివ్యూ',
    'nav.accounts': 'ఖాతాలు',
    'nav.compounding': 'సంపద వృద్ధి',

    // Dashboard
    'dash.financial_velocity': 'ఆర్థిక వేగం & నగదు ప్రవాహం',
    'dash.spent': 'ఈ నెల ఖర్చు',
    'dash.income': 'ఆదాయం',
    'dash.net_savings': 'నికర పొదుపు',
    'dash.savings_rate': 'పొదుపు రేటు',
    'dash.daily_burn': 'రోజువారీ ఖర్చు రేటు',
    'dash.accounts_title': 'ఖాతాలు & నగదు నిల్వలు',
    'dash.ask_finai': 'ఫిన్‌ఏఐ కోపైలట్‌ను అడగండి',
    'dash.finai_prompt_sample': '"ఈ నెలలో ఫుడ్ ఖర్చును ₹5,000 ఎలా తగ్గించాలి?"',
    'dash.compounding_card_title': 'చక్రవడ్డీ శక్తి: చిన్న ఖర్చుల నుండి పెద్ద సంపద',
    'dash.compounding_card_desc': 'నెలకు ₹2,000 పెట్టుబడి పెడితే 20 ఏళ్లలో ₹20+ లక్షలు ఎలా అవుతుందో చూడండి!',
    'dash.compounding_btn': 'సంపద సామర్థ్యాన్ని లెక్కించండి',
    'dash.spending_trend': 'ఖర్చుల ధోరణి & నగదు ప్రవాహం',
    'dash.daily': 'రోజువారీ',
    'dash.cumulative': 'మొత్తం',
    'dash.category_breakdown': 'కేటగిరీ వారీగా ఖర్చులు',
    'dash.budget_speedometer': 'బడ్జెట్ స్పీడోమీటర్లు',
    'dash.recent_transactions': 'ఇటీవలి లావాదేవీలు',
    'dash.view_all': 'అన్నీ చూడండి',
    'dash.fix_ledger': 'సరిచేయండి',

    // Quick Add
    'quickadd.placeholder': '"380 zomato hdfc నుండి" లేదా "నిన్న 2k అద్దె" అని టైప్ చేయండి…',
    'quickadd.log_btn': 'నమోదు చేయండి',
    'quickadd.listening': 'మీ వాయిస్ వింటోంది…',
    'quickadd.quick_pills_food': '380 జొమాటో',
    'quickadd.quick_pills_groceries': '450 జెప్టో',
    'quickadd.quick_pills_fuel': '500 పెట్రోల్',
    'quickadd.quick_pills_uber': '220 ఊబర్',

    // FinAI Chatbot
    'finai.title': 'ఫిన్‌ఏఐ కోపైలట్',
    'finai.gemini_active': 'జెమిని 2.5 యాక్టివ్',
    'finai.subtitle': 'మీ నిజమైన ఆర్థిక డేటా ఆధారంగా వ్యక్తిగతీకరించిన ఆర్థిక మేధస్సు',
    'finai.custom_key': 'కస్టమ్ API కీ',
    'finai.key_set': 'API కీ సెట్ చేయబడింది',
    'finai.clear_chat': 'చాట్ క్లియర్ చేయండి',
    'finai.input_placeholder': 'ఫిన్‌ఏఐని అడగండి: "జొమాటోలో ఎంత ఖర్చయింది?" లేదా "నెలకు ₹2000 ఇన్వెస్ట్ చేస్తే?"…',
    'finai.crunching': 'ఫిన్‌ఏఐ మీ నంబర్లను విశ్లేషిస్తోంది…',

    // Compounding Calculator
    'compound.title': 'చక్రవడ్డీ శక్తి కాలిక్యులేటర్',
    'compound.subtitle': 'చిన్న చిన్న అనవసర ఖర్చులను పొదుపు చేస్తే కలిగే అద్భుతమైన సంపదను తెలుసుకోండి',
    'compound.monthly_amount': 'నెలవారీ ఆదా / పెట్టుబడి మొత్తం',
    'compound.investment_period': 'కాలవ్యవధి (సంవత్సరాలు)',
    'compound.expected_cagr': 'అంచనా వేసిన వార్షిక రాబడి (CAGR %)',
    'compound.total_invested': 'మొత్తం పెట్టిన పెట్టుబడి',
    'compound.estimated_wealth': 'అంచనా వేసిన మొత్తం సంపద (చక్రవడ్డీ)',
    'compound.wealth_gain': 'రాబడుల ద్వారా సృష్టించబడిన సంపద',
    'compound.multiplication_factor': 'వృద్ధి గుణకం',
    'compound.presets_title': 'సాధారణ ఖర్చు అలవాట్లు & వాటి 20 ఏళ్ల విలువ',
    'compound.preset_coffee': '☕ రోజువారీ టీ/కాఫీ (రోజుకు ₹100 = నెలకు ₹3,000)',
    'compound.preset_swiggy': '🍔 వారాంతపు ఫుడ్ ఆర్డర్లు (నెలకు ₹2,000)',
    'compound.preset_sub': '📺 ఉపయోగించని సబ్‌స్క్రిప్షన్‌లు (నెలకు ₹1,000)',
    'compound.preset_party': '🎉 రెస్టారెంట్ ఖర్చులు (నెలకు ₹5,000)',
    'compound.ten_yr_val': '10 సంవత్సరాలలో',
    'compound.twenty_yr_val': '20 సంవత్సరాలలో',
    'compound.thirty_yr_val': '30 సంవత్సరాలలో',

    // Settings & Account
    'settings.title': 'సెట్టింగ్‌లు & ప్రాధాన్యతలు',
    'settings.appearance': 'థీమ్ & రూపురేఖలు',
    'settings.theme_light': 'లైట్ మోడ్',
    'settings.theme_dark': 'డార్క్ మోడ్',
    'settings.theme_system': 'సిస్టమ్ ఆటో',
    'settings.language_title': 'యాప్ భాష / Language / भाषा',
    'settings.currency_title': 'కరెన్సీ ఎంపిక',
    'settings.accounts_title': 'వాలెట్లు & బ్యాంక్ ఖాతాలు',
    'settings.categories_title': 'ఖర్చు కేటగిరీలు',
    'settings.rules_title': 'నేర్చుకున్న వర్గీకరణ నియమాలు',
    'settings.data_title': 'డేటా నిర్వహణ',
    'settings.export_csv': 'అన్ని లావాదేవీలను డౌన్‌లోడ్ చేయండి (CSV)',
    'settings.reset_demo': '40+ డెమో లావాదేవీలకు రీసెట్ చేయండి',
    'settings.sign_out': 'లాగ్ అవుట్',
    'settings.llm_title': 'ఫిన్‌ఏఐ & LLM ఇంజిన్',

    // Family Finance (Phase 8)
    'family.room_title': 'కుటుంబ ఫైనాన్స్ గది',
    'family.scope_my_money': 'నా డబ్బు',
    'family.scope_family': 'కుటుంబం',
    'family.joint_envelopes': 'ఉమ్మడి బడ్జెట్లు',
    'family.joint_goals': 'ఉమ్మడి లక్ష్యాలు',
    'family.ask_family_ai': 'ఫ్యామిలీ AI ని అడగండి',
    'family.fair_share': 'న్యాయమైన భాగస్వామ్యం & సహకారం',
    'family.partner_preview': 'భాగస్వామి వీక్షణ ప్రివ్యూ',
    'family.combined_income': 'ఉమ్మడి ఆదాయం',
    'family.combined_outflow': 'ఉమ్మడి ఖర్చు',
    'family.combined_savings': 'ఉమ్మడి పొదుపు',
    'family.together': 'కలిసి',
    'family.just_me': 'నేను మాత్రమే',
    'family.members_privacy': 'సభ్యులు & ప్రైవసీ నియమాలు',
    'family.invite_partner': 'భాగస్వామిని ఆహ్వానించండి',
    'family.leave_room': 'గది నుండి నిష్క్రమించండి',
    'family.trial_active': 'ట్రయల్ యాక్టివ్',
    'family.add_envelope': 'ఉమ్మడి బడ్జెట్ జోడించండి',
    'family.new_goal': 'కొత్త ఉమ్మడి లక్ష్యం',

    // Safe to Spend & Streaks
    'safe.title': 'ఈ రోజు సురక్షిత ఖర్చు పరిమితి',
    'safe.daily_allowance': 'రోజువారీ కేటాయింపు',
    'safe.how_calculated': 'ఇది ఎలా లెక్కించబడుతుంది?',
    'safe.on_track': 'ఈ నెల సరైన పద్ధతిలో పొదుపు చేస్తున్నారు 🎉',
    'safe.overspending': 'ఖర్చు వేగం ఎక్కువగా ఉంది — తగ్గించండి ⚠️',
    'streaks.title': 'ఖర్చుల నమోదు స్ట్రీక్',
    'streaks.days_active': 'యాక్టివ్ రోజులు',
    'streaks.no_spend_btn': 'ఈ రోజు ఖర్చు చేయలేదు 🎉',
    'streaks.logged_today': 'ఈ రోజు నమోదు చేయబడింది ✨',

    // Budgets & Committed Money
    'budgets.committed_title': 'నిబద్ధత & ఉచిత నిధులు (50/30/20)',
    'budgets.fixed_needs': 'స్థిరమైన ఖర్చులు & అద్దె',
    'budgets.savings_goals': 'రిజర్వ్ చేసిన పొదుపు లక్ష్యాలు',
    'budgets.free_money': 'స్వేచ్ఛగా ఖర్చు చేయగల నిధులు',
    'budgets.add_envelope': 'కేటగిరీ బడ్జెట్ జోడించండి',
    'budgets.pacing_simulator': 'ఇంటరాక్టివ్ పేసింగ్ సిమ్యులేటర్',

    // Ledger & History
    'ledger.search_placeholder': 'మర్చంట్, నోట్ లేదా మొత్తం ద్వారా వెతకండి…',
    'ledger.all_months': 'అన్ని నెలలు',
    'ledger.all_categories': 'అన్ని కేటగిరీలు',
    'ledger.all_wallets': 'అన్ని వాలెట్లు',
    'ledger.all_types': 'అన్ని రకాలు',
    'ledger.import_csv': 'CSV దిగుమతి',
    'ledger.export_csv': 'CSV ఎగుమతి',
    'ledger.no_txns': 'మీ ఫిల్టర్లకు సరిపోయే లావాదేవీలు లేవు',

    // Auth
    'auth.hero_title': 'ఆటోమేటిక్ ఏఐ ఖర్చుల ట్రాకర్ & వెల్త్ కోచ్',
    'auth.signin_tab': 'సైన్ ఇన్',
    'auth.signup_tab': 'ఖాతా తెరవండి',
    'auth.demo_tab': '⚡ డెమో సాండ్‌బాక్స్',
    'auth.email_label': 'ఈమెయిల్ చిరునామా',
    'auth.password_label': 'పాస్‌వర్డ్',
    'auth.name_label': 'మీ పూర్తి పేరు',
    'auth.signin_btn': 'ఈమెయిల్‌తో సైన్ ఇన్ చేయండి',
    'auth.signup_btn': 'ఖాతా సృష్టించండి',
    'auth.google_btn': 'గూగుల్‌తో కొనసాగండి',
    'auth.demo_launch_btn': 'డెమో సాండ్‌బాక్స్ ప్రారంభించండి',
    'auth.security_ssl': '256-బిట్ SSL',
    'auth.security_rls': 'సురక్షిత డేటా ఎన్‌క్రిప్షన్',
    'auth.security_privacy': 'డేటా విక్రయం ఉండదు',
  },

  hi: {
    // Brand & Top Header (हिन्दी)
    'app.title': 'क्लियरस्पेंड',
    'app.tagline': 'एआई एक्सपेंस ट्रैकर और वेल्थ कोच',
    'header.ai_coach': 'एआई कोच',
    'header.review': 'समीक्षा',
    'header.finai': 'फिनएआई',

    // Navigation Tabs
    'nav.overview': 'अवलोकन',
    'nav.ledger': 'लेन-देन',
    'nav.budgets': 'बजट',
    'nav.finai': 'फिनएआई चैट',
    'nav.review': 'समीक्षा',
    'nav.accounts': 'खाते',
    'nav.compounding': 'चक्रवृद्धि धन',

    // Dashboard
    'dash.financial_velocity': 'वित्तीय गति और कैश फ्लो',
    'dash.spent': 'इस महीने का खर्च',
    'dash.income': 'आय',
    'dash.net_savings': 'शुद्ध बचत',
    'dash.savings_rate': 'बचत दर',
    'dash.daily_burn': 'दैनिक खर्च दर',
    'dash.accounts_title': 'खाते और उपलब्ध राशि',
    'dash.ask_finai': 'फिनएआई कोपायलट से पूछें',
    'dash.finai_prompt_sample': '"इस महीने खाने के खर्च में ₹5,000 कैसे बचाएं?"',
    'dash.compounding_card_title': 'कंपाउंडिंग की शक्ति: छोटे खर्चों से बड़ा धन',
    'dash.compounding_card_desc': 'देखें कि महीने में सिर्फ ₹2,000 बचाने पर 20 वर्षों में ₹20+ लाख कैसे बनते हैं!',
    'dash.compounding_btn': 'कंपाउंडिंग धन की गणना करें',
    'dash.spending_trend': 'खर्च की गति और कैश फ्लो ट्रेंड',
    'dash.daily': 'दैनिक',
    'dash.cumulative': 'कुल',
    'dash.category_breakdown': 'श्रेणी अनुसार खर्च',
    'dash.budget_speedometer': 'बजट स्पीडोमीटर',
    'dash.recent_transactions': 'हाल के लेन-देन',
    'dash.view_all': 'सभी देखें',
    'dash.fix_ledger': 'सुधारें',

    // Quick Add
    'quickadd.placeholder': '"380 zomato hdfc से" या "कल 2k किराया" लिखें…',
    'quickadd.log_btn': 'जोड़ें',
    'quickadd.listening': 'आपकी आवाज़ सुन रहा है…',
    'quickadd.quick_pills_food': '380 ज़ोमैटो',
    'quickadd.quick_pills_groceries': '450 ज़ेप्टो',
    'quickadd.quick_pills_fuel': '500 पेट्रोल',
    'quickadd.quick_pills_uber': '220 उबर',

    // FinAI Chatbot
    'finai.title': 'फिनएआई कोपायलट',
    'finai.gemini_active': 'जेमिनी 2.5 एक्टिव',
    'finai.subtitle': 'आपके वास्तविक वित्तीय डेटा पर आधारित स्मार्ट सलाह',
    'finai.custom_key': 'कस्टम एपीआई की',
    'finai.key_set': 'एपीआई की सेट है',
    'finai.clear_chat': 'चैट साफ करें',
    'finai.input_placeholder': 'फिनएआई से पूछें: "ज़ोमैटो पर कितना खर्च हुआ?" या "हर महीने ₹2000 निवेश करने पर क्या होगा?"…',
    'finai.crunching': 'फिनएआई आपके आंकड़ों का विश्लेषण कर रहा है…',

    // Compounding Calculator
    'compound.title': 'कंपाउंडिंग की शक्ति (SIP कैलकुलेटर)',
    'compound.subtitle': 'जानें कि छोटे-छोटे अनावश्यक खर्चों को बचाने पर लंबी अवधि में कितना धन बन सकता है',
    'compound.monthly_amount': 'मासिक बचत / निवेश राशि',
    'compound.investment_period': 'अवधि (वर्ष)',
    'compound.expected_cagr': 'अपेक्षित वार्षिक रिटर्न (CAGR %)',
    'compound.total_invested': 'कुल निवेश की गई राशि',
    'compound.estimated_wealth': 'अनुमानित कुल संपत्ति (कंपाउंडेड)',
    'compound.wealth_gain': 'रिटर्न से बना अतिरिक्त धन',
    'compound.multiplication_factor': 'धन वृद्धि गुणक',
    'compound.presets_title': 'दैनिक खर्च की आदतें और उनका 20 साल का मूल्य',
    'compound.preset_coffee': '☕ रोज़ाना चाय/कॉफ़ी (₹100/दिन = ₹3,000/माह)',
    'compound.preset_swiggy': '🍔 वीकेंड फूड डिलीवरी (₹2,000/माह)',
    'compound.preset_sub': '📺 अनुपयोगी सब्सक्रिप्शन (₹1,000/माह)',
    'compound.preset_party': '🎉 बाहर खाना-पीना (₹5,000/माह)',
    'compound.ten_yr_val': '10 वर्षों में',
    'compound.twenty_yr_val': '20 वर्षों में',
    'compound.thirty_yr_val': '30 वर्षों में',

    // Settings & Account
    'settings.title': 'सेटिंग्स और प्राथमिकताएं',
    'settings.appearance': 'थीम और दिखावट',
    'settings.theme_light': 'लाइट मोड',
    'settings.theme_dark': 'डार्क मोड',
    'settings.theme_system': 'सिस्टम ऑटो',
    'settings.language_title': 'ऐप भाषा / Language / భాష',
    'settings.currency_title': 'मुद्रा (Currency)',
    'settings.accounts_title': 'वॉलेट और बैंक खाते',
    'settings.categories_title': 'खर्च श्रेणियां',
    'settings.rules_title': 'सीखे गए नियम',
    'settings.data_title': 'डेटा प्रबंधन',
    'settings.export_csv': 'सभी लेन-देन डाउनलोड करें (CSV)',
    'settings.reset_demo': '40+ डेमो लेन-देन पर रीसेट करें',
    'settings.sign_out': 'साइन आउट',
    'settings.llm_title': 'फिनएआई और LLM इंजन',

    // Family Finance (Phase 8)
    'family.room_title': 'पारिवारिक वित्त कक्ष',
    'family.scope_my_money': 'मेरा पैसा',
    'family.scope_family': 'परिवार',
    'family.joint_envelopes': 'साझा बजट',
    'family.joint_goals': 'संयुक्त लक्ष्य',
    'family.ask_family_ai': 'पारिवारिक AI से पूछें',
    'family.fair_share': 'उचित विभाजन और साझा योगदान',
    'family.partner_preview': 'पार्टनर दृश्य पूर्वावलोकन',
    'family.combined_income': 'संयुक्त आय',
    'family.combined_outflow': 'संयुक्त खर्च',
    'family.combined_savings': 'संयुक्त बचत',
    'family.together': 'साथ में',
    'family.just_me': 'केवल मैं',
    'family.members_privacy': 'सदस्य और गोपनीयता नियंत्रण',
    'family.invite_partner': 'पार्टनर को आमंत्रित करें',
    'family.leave_room': 'कक्ष छोड़ें',
    'family.trial_active': 'ट्रायल सक्रिय',
    'family.add_envelope': 'साझा बजट जोड़ें',
    'family.new_goal': 'नया संयुक्त लक्ष्य',

    // Safe to Spend & Streaks
    'safe.title': 'आज का सुरक्षित खर्च',
    'safe.daily_allowance': 'दैनिक खर्च सीमा',
    'safe.how_calculated': 'इसकी गणना कैसे होती है?',
    'safe.on_track': 'आप इस महीने सही बचत कर रहे हैं 🎉',
    'safe.overspending': 'खर्च की गति अधिक है — थोड़ा कम करें ⚠️',
    'streaks.title': 'खर्च दर्ज करने की स्ट्रीक',
    'streaks.days_active': 'सक्रिय दिन',
    'streaks.no_spend_btn': 'आज कोई खर्च नहीं 🎉',
    'streaks.logged_today': 'आज दर्ज किया गया ✨',

    // Budgets & Committed Money
    'budgets.committed_title': 'निश्चित प्रतिबद्धताएं और मुक्त धन (50/30/20)',
    'budgets.fixed_needs': 'निश्चित जरूरतें और किराया',
    'budgets.savings_goals': 'आरक्षित बचत लक्ष्य',
    'budgets.free_money': 'पूर्णतः मुक्त खर्च योग्य धन',
    'budgets.add_envelope': 'श्रेणी बजट जोड़ें',
    'budgets.pacing_simulator': 'इंटरएक्टिव पेसिंग सिमुलेटर',

    // Ledger & History
    'ledger.search_placeholder': 'दुकानदार, नोट या राशि द्वारा खोजें…',
    'ledger.all_months': 'सभी महीने',
    'ledger.all_categories': 'सभी श्रेणियां',
    'ledger.all_wallets': 'सभी खाते',
    'ledger.all_types': 'सभी प्रकार',
    'ledger.import_csv': 'CSV आयात करें',
    'ledger.export_csv': 'CSV निर्यात करें',
    'ledger.no_txns': 'फ़िल्टर से मेल खाते कोई लेन-देन नहीं मिले',

    // Auth
    'auth.hero_title': 'स्वचालित एआई खर्च ट्रैकर और वेल्थ कोच',
    'auth.signin_tab': 'साइन इन',
    'auth.signup_tab': 'साइन अप',
    'auth.demo_tab': '⚡ डेमो सैंडबॉक्स',
    'auth.email_label': 'ईमेल पता',
    'auth.password_label': 'पासवर्ड',
    'auth.name_label': 'आपका पूरा नाम',
    'auth.signin_btn': 'ईमेल से साइन इन करें',
    'auth.signup_btn': 'खाता बनाएं',
    'auth.google_btn': 'गूगल से जारी रखें',
    'auth.demo_launch_btn': 'इंटरएक्टिव डेमो शुरू करें',
    'auth.security_ssl': '256-बिट SSL',
    'auth.security_rls': 'सुरक्षित बैंक-ग्रेड सुरक्षा',
    'auth.security_privacy': 'शून्य डेटा बिक्री',
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('clearspend_language');
    return (saved === 'te' || saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('clearspend_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    if (dict[key]) return dict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
