// Bilingual EN/SW translations
const translations = {
  en: {
    // App
    app_name: 'Ria',
    tagline: 'Rotary/Rotaract in Action',
    language: 'Language',
    // Auth
    register: 'Register',
    login: 'Log In',
    logout: 'Log Out',
    name: 'Full Name',
    club: 'Club Name',
    email: 'Email Address',
    phone: 'Phone Number',
    password: 'Password',
    confirm_password: 'Confirm Password',
    forgot_password: 'Forgot password?',
    or: 'or',
    already_have_account: 'Already have an account?',
    no_account: 'New to Ria?',
    email_or_phone: 'Email or phone number',
    creating_account: 'Creating account…',
    logging_in: 'Logging in…',
    // Dashboard
    hello: 'Hello',
    my_projects: 'My Projects',
    browse_projects: 'Browse Projects',
    no_projects: 'No projects yet',
    join_project: 'Join a project to get started',
    impact_summary: 'Your Impact',
    achievements: 'Achievements',
    submissions: 'submissions',
    regions: 'regions',
    minutes: 'minutes',
    // Projects
    start_submission: 'Start New Submission',
    submission_count: 'Your submissions',
    pending_sync: 'pending sync',
    // Project Briefing
    project_briefing: 'Project Briefing',
    continue_to_questionnaire: 'Continue to Questionnaire',
    view_project_info: 'View project info',
    briefing_first_time: 'Read before you begin',
    // Questionnaire
    submit: 'Submit',
    submitting: 'Submitting…',
    submitted: 'Submitted ✓',
    submit_another: 'Submit Another',
    back_to_home: 'Back to Home',
    next: 'Next',
    back: 'Back',
    step_of: 'of',
    gps_accuracy: 'GPS Accuracy',
    capturing_location: 'Capturing location…',
    location_captured: 'Location captured',
    location_denied: 'Location permission denied',
    location_optional: 'Location is optional for this submission',
    location_required: 'Location is required for this submission',
    // Achievements
    locked: 'Locked',
    unlocked: 'Unlocked',
    unlock_hint: 'to unlock',
    // Suggestions
    suggestion_placeholder: 'Share your thoughts, feedback, or ideas…',
    send_suggestion: 'Send Suggestion',
    anonymous: 'Send anonymously',
    attributed: 'Include my name',
    suggestion_sent: 'Suggestion sent!',
    character_limit: 'characters remaining',
    // Offline
    offline: 'You\'re offline — data will sync when reconnected',
    syncing: 'Syncing…',
    sync_failed: 'Sync pending — data saved locally',
    // Install
    add_to_home: 'Add Ria to your home screen',
    ios_instructions: 'Tap the Share button, then "Add to Home Screen"',
    android_instructions: 'Tap Install below, or tap ⋮ then "Add to Home Screen"',
    install_now: 'Install',
    skip: 'Skip for now',
    installed: 'Ria is installed ✓',
    // Help
    help: 'Help',
    faq: 'Frequently Asked Questions',
    // Profile
    profile: 'Profile',
    settings: 'Settings',
    save: 'Save Changes',
    profile_picture: 'Profile Picture',
    leaderboard_visibility: 'Show me on leaderboards',
    leaderboard_visibility_hint: 'When off, your name is hidden from all rankings',
    // Nav
    home: 'Home',
    projects: 'Projects',
    suggestions: 'Suggestions',
    announcements: 'Announcements',
    // Leaderboard
    leaderboard: 'Leaderboard',
    by_individual: 'Individuals',
    by_club: 'Clubs',
    metric_submissions: 'Submissions',
    metric_minutes: 'Impact Minutes',
    metric_regions: 'Regions',
    global_ranking: 'Global',
    project_ranking: 'This Project',
    your_rank: 'Your rank',
    // Announcements
    no_announcements: 'No announcements yet',
    announcements_empty: 'Check back later for updates from your project admins.',
    pinned: 'Pinned',
    mark_read: 'Mark as read',
    // Tutorial
    tutorial_skip: 'Skip',
    tutorial_next: 'Next',
    tutorial_done: 'Get started',
    // States
    loading: 'Loading…',
    error: 'Something went wrong',
    retry: 'Try again',
    // Admin
    admin_login: 'Admin Login',
    admin_dashboard: 'Dashboard',
    total_projects: 'Active Projects',
    total_submissions: 'Submissions this week',
    total_users: 'Registered Users',
    pending_suggestions: 'Pending Suggestions',
    new_project: 'New Project',
    save_project: 'Save Project',
    questionnaire_builder: 'Questionnaire Builder',
    add_question: 'Add Question',
    question_text: 'Question text',
    question_type: 'Type',
    required: 'Required',
    optional: 'Optional',
    export_csv: 'Export CSV',
    export_json: 'Export JSON',
    view_report: 'Generate Impact Report',
    download_report: 'Download Report',
  },
  sw: {
    // App
    app_name: 'Ria',
    tagline: 'Rotary/Rotaract Inayofanya Kazi',
    language: 'Lugha',
    // Auth
    register: 'Jisajili',
    login: 'Ingia',
    logout: 'Toka',
    name: 'Jina Kamili',
    club: 'Jina la Klabu',
    email: 'Anwani ya Barua Pepe',
    phone: 'Nambari ya Simu',
    password: 'Neno la Siri',
    confirm_password: 'Thibitisha Neno la Siri',
    forgot_password: 'Umesahau neno la siri?',
    or: 'au',
    already_have_account: 'Una akaunti tayari?',
    no_account: 'Mpya kwenye Ria?',
    email_or_phone: 'Barua pepe au nambari ya simu',
    creating_account: 'Inaunda akaunti…',
    logging_in: 'Inaingia…',
    // Dashboard
    hello: 'Habari',
    my_projects: 'Miradi Yangu',
    browse_projects: 'Tafuta Miradi',
    no_projects: 'Hakuna miradi bado',
    join_project: 'Jiunge na mradi kuanza',
    impact_summary: 'Mchango Wako',
    achievements: 'Mafanikio',
    submissions: 'mawasilisho',
    regions: 'mikoa',
    minutes: 'dakika',
    // Projects
    start_submission: 'Anza Uwasilishaji Mpya',
    submission_count: 'Mawasilisho yako',
    pending_sync: 'inasubiri usawazishaji',
    // Project Briefing
    project_briefing: 'Maelezo ya Mradi',
    continue_to_questionnaire: 'Endelea kwa Dodoso',
    view_project_info: 'Ona maelezo ya mradi',
    briefing_first_time: 'Soma kabla hujaanza',
    // Questionnaire
    submit: 'Wasilisha',
    submitting: 'Inawasilisha…',
    submitted: 'Imewasilishwa ✓',
    submit_another: 'Wasilisha Nyingine',
    back_to_home: 'Rudi Nyumbani',
    next: 'Endelea',
    back: 'Rudi',
    step_of: 'ya',
    gps_accuracy: 'Usahihi wa GPS',
    capturing_location: 'Inachukua mahali…',
    location_captured: 'Mahali limechukuliwa',
    location_denied: 'Ruhusa ya mahali imekataliwa',
    location_optional: 'Mahali si lazima kwa uwasilishaji huu',
    location_required: 'Mahali inahitajika kwa uwasilishaji huu',
    // Achievements
    locked: 'Imefungwa',
    unlocked: 'Imefunguliwa',
    unlock_hint: 'kufungua',
    // Suggestions
    suggestion_placeholder: 'Shiriki mawazo, maoni, au mapendekezo yako…',
    send_suggestion: 'Tuma Pendekezo',
    anonymous: 'Tuma bila jina',
    attributed: 'Jumuisha jina langu',
    suggestion_sent: 'Pendekezo limetumwa!',
    character_limit: 'herufi zilizobaki',
    // Offline
    offline: 'Huna mtandao — data itasawazishwa ukiunganika tena',
    syncing: 'Inasawazisha…',
    sync_failed: 'Usawazishaji unangoja — data imehifadhiwa',
    // Install
    add_to_home: 'Ongeza Ria kwenye skrini yako ya nyumbani',
    ios_instructions: 'Bonyeza kitufe cha Kushiriki, kisha "Ongeza kwenye Skrini ya Nyumbani"',
    android_instructions: 'Bonyeza Sakinisha hapa chini, au ⋮ kisha "Ongeza kwenye Skrini ya Nyumbani"',
    install_now: 'Sakinisha',
    skip: 'Ruka kwa sasa',
    installed: 'Ria imesanikishwa ✓',
    // Help
    help: 'Msaada',
    faq: 'Maswali Yanayoulizwa Mara Kwa Mara',
    // Profile
    profile: 'Wasifu',
    settings: 'Mipangilio',
    save: 'Hifadhi Mabadiliko',
    profile_picture: 'Picha ya Wasifu',
    leaderboard_visibility: 'Nionyeshe kwenye orodha ya ushindani',
    leaderboard_visibility_hint: 'Ukizima, jina lako halionekani kwenye orodha yoyote',
    // Nav
    home: 'Nyumbani',
    projects: 'Miradi',
    suggestions: 'Maoni',
    announcements: 'Matangazo',
    // Leaderboard
    leaderboard: 'Orodha ya Ushindani',
    by_individual: 'Watu Binafsi',
    by_club: 'Klabu',
    metric_submissions: 'Mawasilisho',
    metric_minutes: 'Dakika za Athari',
    metric_regions: 'Mikoa',
    global_ranking: 'Ulimwenguni',
    project_ranking: 'Mradi Huu',
    your_rank: 'Nafasi yako',
    // Announcements
    no_announcements: 'Hakuna matangazo bado',
    announcements_empty: 'Angalia baadaye kwa masasisho kutoka kwa wasimamizi wako.',
    pinned: 'Imepachikwa',
    mark_read: 'Weka kama imesomwa',
    // Tutorial
    tutorial_skip: 'Ruka',
    tutorial_next: 'Endelea',
    tutorial_done: 'Anza',
    // States
    loading: 'Inapakia…',
    error: 'Kuna hitilafu',
    retry: 'Jaribu tena',
    // Admin
    admin_login: 'Ingia kama Msimamizi',
    admin_dashboard: 'Dashibodi',
    total_projects: 'Miradi Inayofanya Kazi',
    total_submissions: 'Mawasilisho wiki hii',
    total_users: 'Watumiaji Waliojisajili',
    pending_suggestions: 'Maoni Yanayosubiri',
    new_project: 'Mradi Mpya',
    save_project: 'Hifadhi Mradi',
    questionnaire_builder: 'Mjenzi wa Dodoso',
    add_question: 'Ongeza Swali',
    question_text: 'Maandishi ya swali',
    question_type: 'Aina',
    required: 'Inahitajika',
    optional: 'Si lazima',
    export_csv: 'Hamisha CSV',
    export_json: 'Hamisha JSON',
    view_report: 'Tengeneza Ripoti ya Athari',
    download_report: 'Pakua Ripoti',
  },
};

let currentLang = localStorage.getItem('ria_lang') || 'en';

export function t(key) {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ria_lang', lang);
  document.documentElement.lang = lang;
}

export function getLang() {
  return currentLang;
}

export default { t, setLang, getLang };
