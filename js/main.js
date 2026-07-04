const DEFAULT_PRODUCTION_API_BASE_URL = "https://m62-webtv-production.up.railway.app";

function resolveApiBaseUrl() {
    const fromWindow = typeof window !== "undefined" ? window.M62_API_BASE_URL : "";
    if (fromWindow) {
        return String(fromWindow).replace(/\/+$/, "");
    }

    const fromStorage = localStorage.getItem("m62ApiBaseUrl") || "";
    if (fromStorage) {
        return String(fromStorage).replace(/\/+$/, "");
    }

    if (typeof window !== "undefined" && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
            const localPreference = String(localStorage.getItem("m62UseLocalApi") || "").toLowerCase();
            if (localPreference === "false") {
                return DEFAULT_PRODUCTION_API_BASE_URL;
            }

            // For local development, prefer local backend by default.
            return "http://localhost:3000";
        }

        // In production, default to deployed backend API host.
        return DEFAULT_PRODUCTION_API_BASE_URL;
    }

    // For direct file:// previews, prefer the deployed backend unless an explicit override is set.
    return DEFAULT_PRODUCTION_API_BASE_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

function resolveDataSaverMode() {
    const override = String(localStorage.getItem("m62DataSaver") || "auto").toLowerCase();
    if (override === "true") {
        return true;
    }

    if (override === "false") {
        return false;
    }

    const connection = typeof navigator !== "undefined"
        ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
        : null;

    if (!connection) {
        return false;
    }

    const effectiveType = String(connection.effectiveType || "").toLowerCase();
    return Boolean(connection.saveData) || effectiveType.includes("2g") || effectiveType === "slow-2g";
}

const DATA_SAVER_ENABLED = resolveDataSaverMode();
const HOME_NEWS_PAGE_SIZE = DATA_SAVER_ENABLED ? 6 : 12;
const HOME_FEATURED_PAGE_SIZE = DATA_SAVER_ENABLED ? 4 : 8;
const HOME_CAROUSEL_PAGE_SIZE = DATA_SAVER_ENABLED ? 3 : 6;
const HOME_VIDEOS_PAGE_SIZE = DATA_SAVER_ENABLED ? 4 : 12;
const HOME_GALLERY_PAGE_SIZE = DATA_SAVER_ENABLED ? 6 : 10;
const HOME_GALLERY_MAX_ITEMS = DATA_SAVER_ENABLED ? 6 : 12;
const HOME_TICKER_PAGE_SIZE = DATA_SAVER_ENABLED ? 6 : 12;
const DEFAULT_LANGUAGE = "ha";
const SUPPORTED_LANGUAGES = ["ha", "dje", "ff", "en", "fr", "ar"];
let currentLanguage = DEFAULT_LANGUAGE;

const I18N = {
    ha: {
        headerTagline: "La Voix Du Peuple | Muryar Jama'a 🇳🇪",
        languageLabel: "Yare",
        searchPlaceholder: "🔍 Nema labari ko bidiyo...",
        searchButton: "Nema",
        navHome: "Home",
        navLive: "Live TV",
        navNews: "Labarai",
        navFeatured: "Fittatattu",
        navPrograms: "Shirye-shirye",
        navVideos: "Jerin Talabiji",
        navGallery: "Hotuna",
        navContact: "Tuntube Mu",
        heroSubtitle: "Muryar Niger zuwa duniya",
        heroTopics: "Labarai masu zafi • Siyasa • Tattalin arziki • Wasanni • Nishaɗi • Live TV",
        watchLiveButton: "🔴 KALLI KAI TSAYE",
        carouselHeading: "⭐ Fitattun Labarai",
        liveHeading: "🔴 LIVE TV",
        newsHeading: "📰 Sabbin Labarai",
        featuredHeading: "⭐ Fittatun Labarai",
        featuredIntro: "Manyan labaran da suka fi daukar hankali daga M62 WEB TV.",
        programsHeading: "📺 Jadawalin Shirye-shirye",
        programsIntro: "Lokutan manyan shirye-shiryen M62 WEB TV na yau da kullum.",
        program1Title: "🎤 Labaran Safe",
        program1Desc: "Takaitattun labarai da bayanan rana.",
        program2Title: "📰 Nazarin Labarai",
        program2Desc: "Tattaunawa kan manyan abubuwan da ke faruwa.",
        program3Title: "⚽ Wasanni",
        program3Desc: "Sakamako da nazarin wasanni na gida da waje.",
        program4Title: "🌙 Shirin Yamma",
        program4Desc: "Babban shirin dare da bakuncin masana.",
        program5Title: "💼 Kasuwanci",
        program5Desc: "Labarai da shawarwari kan kasuwanci da harkokin sana'a.",
        program6Title: "🕌 Addini",
        program6Desc: "Wa'azi da darussa na addini domin al'umma.",
        program7Title: "🎭 Nishadi",
        program7Desc: "Shirin nishadi da sabbin labaran masana'antar nishaɗi.",
        program8Title: "📚 Ilimi",
        program8Desc: "Darussa, nasiha da bayanai masu taimakawa dalibai.",
        program9Title: "🎙️ Tattaunawa",
        program9Desc: "Tattaunawar kai tsaye da baki kan manyan batutuwa.",
        program10Title: "🏺 Tarihi",
        program10Desc: "Shirin tarihi da al'adu na Niger da Afirka.",
        program11Title: "🧒 Sashin Yara Kanana",
        program11Desc: "Nishadi da ilimi na yara tare da shirye-shiryen tarbiyya.",
        program12Title: "❓ Tambaya da Amsa",
        program12Desc: "Masu kallo na aika tambayoyi, masana na ba da amsoshi.",
        program13Title: "⚖️ Doka da Shari'a",
        program13Desc: "Bayani kan doka, hakkoki da wajibai na 'yan kasa.",
        videosHeading: "🎬 Jerin Talabiji",
        galleryHeading: "🖼️ Hotunan Labarai",
        galleryIntro: "Zababbun hotuna daga labarai da bidiyo.",
        contactHeading: "📞 Tuntube Mu",
        contactHours: "🕒 Litinin - Asabar: 08:00 - 20:00",
        contactNamePlaceholder: "Sunanka",
        contactEmailPlaceholder: "Imel",
        contactSubjectPlaceholder: "Taken sako",
        contactMessagePlaceholder: "Rubuta sakonka...",
        contactSubmit: "Aika Sako",
        newsletterHeading: "📩 Yi rijista domin samun sabbin labarai",
        newsletterPlaceholder: "Shigar da imel dinka",
        newsletterButton: "Yi Rijista",
        footerText: "© 2026 M62 WEB TV NIGER | Powered by PDG MULTIMEDIA TV LTD",
        loadingEngagement: "Ana loda comments da rating...",
        engagementName: "Sunanka (optional)",
        engagementMessage: "Rubuta comment",
        engagementRate: "Yi rating",
        noRating: "Babu rating",
        send: "Tura",
        noNewsYet: "Babu labari da aka wallafa yanzu.",
        noFeaturedNews: "Babu fittatun labarai yanzu.",
        topStory: "LABARI NA FARKO",
        featured: "FITATTE",
        noFeaturedInCarousel: "Babu fitattun labarai yanzu. Da fatan a kara labarai daga admin.",
        featuredNewsFallback: "Fitaccen Labari",
        noVideosYet: "Babu bidiyo da aka wallafa yanzu.",
        watchVideo: "Kalli bidiyo",
        newsImage: "Hoton Labari",
        videoThumbnail: "Hoton bidiyo",
        noGalleryYet: "Babu hotuna yanzu. Da fatan a kara hotuna a news/videos admin.",
        noCommentsYet: "Babu comments yanzu.",
        anonymous: "Ba a saka suna ba",
        avgRating: "Matsakaicin rating",
        ratings: "ratings",
        comments: "comments",
        feedbackFillAll: "Da fatan a cika dukkan filaye.",
        feedbackSendError: "Akwai matsala wajen tura sako.",
        feedbackSent: "An aika sakonka cikin nasara.",
        feedbackSendFailed: "An kasa aika sako yanzu.",
        newsletterInvalid: "Shigar da ingantaccen imel.",
        newsletterSuccess: "Nagode. An yi rijista cikin nasara."
    },
    en: {
        headerTagline: "The Voice of the People 🇳🇪",
        languageLabel: "Language",
        searchPlaceholder: "🔍 Search news or videos...",
        searchButton: "Search",
        navHome: "Home",
        navLive: "Live TV",
        navNews: "News",
        navFeatured: "Featured",
        navPrograms: "Programs",
        navVideos: "TV List",
        navGallery: "Gallery",
        navContact: "Contact",
        heroSubtitle: "The Voice of Niger to the World",
        heroTopics: "Breaking News • Politics • Economy • Sports • Entertainment • Live TV",
        watchLiveButton: "🔴 WATCH LIVE",
        carouselHeading: "⭐ Featured Stories",
        liveHeading: "🔴 LIVE TV",
        newsHeading: "📰 Latest News",
        featuredHeading: "⭐ Featured News",
        featuredIntro: "Top highlights from M62 WEB TV.",
        programsHeading: "📺 Program Schedule",
        programsIntro: "Daily flagship programs on M62 WEB TV.",
        program1Title: "🎤 Morning News",
        program1Desc: "Daily headline roundup.",
        program2Title: "📰 News Analysis",
        program2Desc: "Deep analysis of key events.",
        program3Title: "⚽ Sports",
        program3Desc: "Local and international sports highlights.",
        program4Title: "🌙 Evening Show",
        program4Desc: "Prime-time program with guest experts.",
        program5Title: "💼 Business",
        program5Desc: "Business news, market updates, and entrepreneurship tips.",
        program6Title: "🕌 Religion",
        program6Desc: "Faith-based teachings and spiritual guidance for the community.",
        program7Title: "🎭 Entertainment",
        program7Desc: "Entertainment shows and celebrity lifestyle updates.",
        program8Title: "📚 Education",
        program8Desc: "Learning segments, study support, and school-focused content.",
        program9Title: "🎙️ Talk Show",
        program9Desc: "Live discussions with guests on major social topics.",
        program10Title: "🏺 History",
        program10Desc: "Stories from Niger and African history and heritage.",
        program11Title: "🧒 Kids Corner",
        program11Desc: "Safe and educational programs designed for young children.",
        program12Title: "❓ Q and A",
        program12Desc: "Audience questions answered by experts in studio.",
        program13Title: "⚖️ Law and Rights",
        program13Desc: "Practical legal guidance on citizens' rights and responsibilities.",
        videosHeading: "🎬 TV Playlist",
        galleryHeading: "🖼️ News Images",
        galleryIntro: "Selected images from news and videos.",
        contactHeading: "📞 Contact Us",
        contactHours: "🕒 Monday - Saturday: 08:00 - 20:00",
        contactNamePlaceholder: "Your name",
        contactEmailPlaceholder: "Email",
        contactSubjectPlaceholder: "Subject",
        contactMessagePlaceholder: "Write your message...",
        contactSubmit: "Send Message",
        newsletterHeading: "📩 Subscribe for latest updates",
        newsletterPlaceholder: "Enter your email",
        newsletterButton: "Subscribe",
        footerText: "© 2026 M62 WEB TV NIGER | Powered by PDG MULTIMEDIA TV LTD",
        loadingEngagement: "Loading ratings and comments...",
        engagementName: "Your name (optional)",
        engagementMessage: "Write a comment",
        engagementRate: "Rate this item",
        noRating: "No rating",
        send: "Send",
        noNewsYet: "No news published yet.",
        noFeaturedNews: "No featured news available yet.",
        topStory: "TOP STORY",
        featured: "FEATURED",
        noFeaturedInCarousel: "No featured stories yet. Please publish news from admin.",
        featuredNewsFallback: "Featured Story",
        noVideosYet: "No videos published yet.",
        watchVideo: "Watch video",
        newsImage: "News image",
        videoThumbnail: "Video thumbnail",
        noGalleryYet: "No gallery images available yet. Add cover images or thumbnails in admin.",
        noCommentsYet: "No comments yet.",
        anonymous: "Anonymous",
        avgRating: "Average rating",
        ratings: "ratings",
        comments: "comments",
        feedbackFillAll: "Please fill in all fields.",
        feedbackSendError: "There was an issue sending your message.",
        feedbackSent: "Your message was sent successfully.",
        feedbackSendFailed: "Unable to send your message now.",
        newsletterInvalid: "Please enter a valid email.",
        newsletterSuccess: "Thank you. Subscription successful."
    },
    fr: {
        headerTagline: "La Voix du Peuple 🇳🇪",
        languageLabel: "Langue",
        searchPlaceholder: "🔍 Rechercher des nouvelles ou vidéos...",
        searchButton: "Rechercher",
        navHome: "Accueil",
        navLive: "TV en direct",
        navNews: "Actualités",
        navFeatured: "À la une",
        navPrograms: "Programmes",
        navVideos: "Liste TV",
        navGallery: "Galerie",
        navContact: "Contact",
        heroSubtitle: "La voix du Niger vers le monde",
        heroTopics: "Dernières nouvelles • Politique • Économie • Sports • Divertissement • Direct",
        watchLiveButton: "🔴 REGARDER EN DIRECT",
        carouselHeading: "⭐ Actualités à la une",
        liveHeading: "🔴 TV EN DIRECT",
        newsHeading: "📰 Dernières actualités",
        featuredHeading: "⭐ Nouvelles vedettes",
        featuredIntro: "Principaux points forts de M62 WEB TV.",
        programsHeading: "📺 Grille des programmes",
        programsIntro: "Programmes phares quotidiens sur M62 WEB TV.",
        program1Title: "🎤 Journal du matin",
        program1Desc: "Résumé quotidien des titres.",
        program2Title: "📰 Analyse des infos",
        program2Desc: "Analyse approfondie des événements clés.",
        program3Title: "⚽ Sports",
        program3Desc: "Temps forts sportifs locaux et internationaux.",
        program4Title: "🌙 Émission du soir",
        program4Desc: "Programme de grande écoute avec des experts.",
        program5Title: "💼 Business",
        program5Desc: "Actualites du commerce, du marche et de l'entrepreneuriat.",
        program6Title: "🕌 Religion",
        program6Desc: "Enseignements religieux et conseils spirituels pour la communaute.",
        program7Title: "🎭 Divertissement",
        program7Desc: "Emissions de divertissement et actualites culturelles.",
        program8Title: "📚 Education",
        program8Desc: "Contenu educatif, soutien scolaire et orientation.",
        program9Title: "🎙️ Debat",
        program9Desc: "Debats en direct avec des invites sur les sujets majeurs.",
        program10Title: "🏺 Histoire",
        program10Desc: "Recits de l'histoire et du patrimoine du Niger et de l'Afrique.",
        program11Title: "🧒 Espace Enfants",
        program11Desc: "Programmes educatifs et ludiques pour les jeunes enfants.",
        program12Title: "❓ Questions-Reponses",
        program12Desc: "Questions du public et reponses d'experts.",
        program13Title: "⚖️ Droit et Justice",
        program13Desc: "Explications simples sur les lois, droits et devoirs des citoyens.",
        videosHeading: "🎬 Playlist TV",
        galleryHeading: "🖼️ Images d'actualité",
        galleryIntro: "Images sélectionnées des nouvelles et vidéos.",
        contactHeading: "📞 Contactez-nous",
        contactHours: "🕒 Lundi - Samedi: 08:00 - 20:00",
        contactNamePlaceholder: "Votre nom",
        contactEmailPlaceholder: "Email",
        contactSubjectPlaceholder: "Sujet",
        contactMessagePlaceholder: "Écrivez votre message...",
        contactSubmit: "Envoyer",
        newsletterHeading: "📩 Abonnez-vous aux dernières nouvelles",
        newsletterPlaceholder: "Entrez votre email",
        newsletterButton: "S'abonner",
        footerText: "© 2026 M62 WEB TV NIGER | Powered by PDG MULTIMEDIA TV LTD",
        loadingEngagement: "Chargement des notes et commentaires...",
        engagementName: "Votre nom (optionnel)",
        engagementMessage: "Écrire un commentaire",
        engagementRate: "Noter cet élément",
        noRating: "Pas de note",
        send: "Envoyer",
        noNewsYet: "Aucune actualité publiée.",
        noFeaturedNews: "Aucune actualité à la une pour le moment.",
        topStory: "À LA UNE",
        featured: "VEDETTE",
        noFeaturedInCarousel: "Aucune actualité vedette pour le moment.",
        featuredNewsFallback: "Actualité vedette",
        noVideosYet: "Aucune vidéo publiée.",
        watchVideo: "Regarder la vidéo",
        newsImage: "Image actualité",
        videoThumbnail: "Miniature vidéo",
        noGalleryYet: "Aucune image disponible. Ajoutez des couvertures dans l'admin.",
        noCommentsYet: "Aucun commentaire.",
        anonymous: "Anonyme",
        avgRating: "Note moyenne",
        ratings: "notes",
        comments: "commentaires",
        feedbackFillAll: "Veuillez remplir tous les champs.",
        feedbackSendError: "Erreur lors de l'envoi du message.",
        feedbackSent: "Votre message a été envoyé avec succès.",
        feedbackSendFailed: "Impossible d'envoyer le message maintenant.",
        newsletterInvalid: "Veuillez entrer un email valide.",
        newsletterSuccess: "Merci. Inscription réussie."
    },
    dje: {
        headerTagline: "Jama boona ciina 🇳🇪",
        languageLabel: "Ciine",
        searchPlaceholder: "🔍 Hanga labari wala video...",
        searchButton: "Hanga",
        navHome: "Goro",
        navLive: "Live TV",
        navNews: "Alhabar",
        navFeatured: "Feeri",
        navPrograms: "Shirya",
        navVideos: "Video",
        navGallery: "Biiya",
        navContact: "Huru",
        heroSubtitle: "Niger jinde ga adduɲɲa",
        heroTopics: "Alhabar zanka • Siyasa • Arziki • Wasanni • Nishaadi • Live TV",
        watchLiveButton: "🔴 GUNA LIVE",
        carouselHeading: "⭐ Alhabar feeri",
        liveHeading: "🔴 LIVE TV",
        newsHeading: "📰 Alhabar taaga",
        featuredHeading: "⭐ Alhabar feeri",
        featuredIntro: "M62 WEB TV ra alhabar feeri beeri.",
        programsHeading: "📺 Goyra shirya",
        programsIntro: "M62 WEB TV ra shiri beeri han ka han.",
        program1Title: "🎤 Alhabar susuba",
        program1Desc: "Taakasu alhabar han ra.",
        program2Title: "📰 Nazari alhabar",
        program2Desc: "Tattaunawa ga batu beeri.",
        program3Title: "⚽ Wasanni",
        program3Desc: "Sakamako nda nazari wasanni.",
        program4Title: "🌙 Shiri almisu",
        program4Desc: "Shiri beeri almisu nda baako.",
        program5Title: "💼 Kasuwanci",
        program5Desc: "Alhabar kasuwanci nda shawarwari ga sana'a.",
        program6Title: "🕌 Addini",
        program6Desc: "Wa'azi nda darussa addini i ga jama'a.",
        program7Title: "🎭 Nishadi",
        program7Desc: "Shiri nishadi nda alhabar nishaadi taaga.",
        program8Title: "📚 Ilimi",
        program8Desc: "Darussa nda bayanai kaakaw ga dalibai.",
        program9Title: "🎙️ Tattaunawa",
        program9Desc: "Faakaaray kaanu nda baako ga batu beeri.",
        program10Title: "🏺 Tarihi",
        program10Desc: "Shiri tarihi nda al'adu Niger nda Afrika.",
        program11Title: "🧒 Sashin Yara",
        program11Desc: "Shirye-shirye na yara ga ilimi nda nishadi.",
        program12Title: "❓ Tambaya da Amsa",
        program12Desc: "Jama'a ga tambaya, masana ga ba amsa.",
        program13Title: "⚖️ Doka nda Shari'a",
        program13Desc: "Bayani ga doka, hakko nda wajibai na 'yan kasa.",
        videosHeading: "🎬 Jerin video",
        galleryHeading: "🖼️ Biiya alhabar",
        galleryIntro: "Alhabar nda video biiya suuba.",
        contactHeading: "📞 Huru ir se",
        contactHours: "🕒 Alatin - Asibti: 08:00 - 20:00",
        contactNamePlaceholder: "Ma maa",
        contactEmailPlaceholder: "Email",
        contactSubjectPlaceholder: "Batu",
        contactMessagePlaceholder: "Hantum war sako...",
        contactSubmit: "Sanney",
        newsletterHeading: "📩 Siga ka duu alhabar taaga",
        newsletterPlaceholder: "Email war zaa",
        newsletterButton: "Siga",
        footerText: "© 2026 M62 WEB TV NIGER | Powered by PDG MULTIMEDIA TV LTD",
        loadingEngagement: "Comments nda ratings goy...",
        engagementName: "Ma maa (optional)",
        engagementMessage: "Hantum comment",
        engagementRate: "Teeri rating",
        noRating: "Boro si rating",
        send: "Sanney",
        noNewsYet: "Alhabar kul si wallafa jina.",
        noFeaturedNews: "Alhabar feeri kul si jina.",
        topStory: "ALHABAR FEERU",
        featured: "FEERI",
        noFeaturedInCarousel: "Alhabar feeri kul si jina. Admin ma tonton alhabar.",
        featuredNewsFallback: "Alhabar feeri",
        noVideosYet: "Video kul si wallafa jina.",
        watchVideo: "Guna video",
        newsImage: "Biiya alhabar",
        videoThumbnail: "Biiya video",
        noGalleryYet: "Biiya kul si jina. Admin ma tonton biiya.",
        noCommentsYet: "Comments kul si jina.",
        anonymous: "Maa si",
        avgRating: "Rating matsakaici",
        ratings: "ratings",
        comments: "comments",
        feedbackFillAll: "Waafakay, cika filaye kul.",
        feedbackSendError: "Matsala duu sanda ga tura sako.",
        feedbackSent: "War sako gonda tura kaanante.",
        feedbackSendFailed: "Sako si hin tura sohõõ.",
        newsletterInvalid: "Waafakay, na email boryo zaa.",
        newsletterSuccess: "Fofo. Siga gonda kaanante."
    },
    ff: {
        headerTagline: "Daande yimbe 🇳🇪",
        languageLabel: "Ɗemngal",
        searchPlaceholder: "🔍 Yiylo habaru maa video...",
        searchButton: "Yiylo",
        navHome: "Galle",
        navLive: "Live TV",
        navNews: "Habaru",
        navFeatured: "Cuɓaaɗe",
        navPrograms: "Wurooji",
        navVideos: "Videooji",
        navGallery: "Nataali",
        navContact: "Jokkondir",
        heroSubtitle: "Daande Niger haa aduna",
        heroTopics: "Habaru hesere • Siyaasa • Arziki • Sport • Nderndam • Live TV",
        watchLiveButton: "🔴 YEƳTU LIVE",
        carouselHeading: "⭐ Habaru cuɓaaɗe",
        liveHeading: "🔴 LIVE TV",
        newsHeading: "📰 Habaru keso",
        featuredHeading: "⭐ Habaru cuɓaaɗe",
        featuredIntro: "Habaru mawɗe e M62 WEB TV.",
        programsHeading: "📺 Jadawal wurooji",
        programsIntro: "Wurooji M62 WEB TV ñalnde kala.",
        program1Title: "🎤 Habaru subaka",
        program1Desc: "Taƴte habaru ñalnde.",
        program2Title: "📰 Njiilaw habaru",
        program2Desc: "Faamde e habaru mawɗe.",
        program3Title: "⚽ Sport",
        program3Desc: "Sakamako e faamde sport.",
        program4Title: "🌙 Wuro hiirnaange",
        program4Desc: "Wuro mawɗo jemma e hoɓɓe.",
        program5Title: "💼 Kasuuje",
        program5Desc: "Habaru kasuuje e paamol nguurndam e cuuɗi.",
        program6Title: "🕌 Diina",
        program6Desc: "Waajuuji e janngol diina ngam yimɓe.",
        program7Title: "🎭 Nderndam",
        program7Desc: "Wurooji nderndam e habaru jaŋngorde nderndam.",
        program8Title: "📚 Janngol",
        program8Desc: "Darooji janngol e wallitgol ɗalib'en.",
        program9Title: "🎙️ Faamondiral",
        program9Desc: "Faamondiral nder yeeso e hoɓɓe dow batte mawɗe.",
        program10Title: "🏺 Tariiki",
        program10Desc: "Wurooji tariiki e ndonaaɗe Niger e Afrika.",
        program11Title: "🧒 Sektor Sukaaɓe",
        program11Desc: "Wurooji sukaaɓe ngam janngol e nderndam.",
        program12Title: "❓ Naamne e Jaabte",
        program12Desc: "Yimɓe na naamna, moodiɓɓe na jaaba.",
        program13Title: "⚖️ Dooka e Cariya",
        program13Desc: "Faamde dooka, hakkeeji e waajibaaji yimɓe.",
        videosHeading: "🎬 Jeriñ videooji",
        galleryHeading: "🖼️ Nataali habaru",
        galleryIntro: "Nataali suɓaaɗi e habaru e videooji.",
        contactHeading: "📞 Jokkondir e amen",
        contactHours: "🕒 Altine - Asibti: 08:00 - 20:00",
        contactNamePlaceholder: "Innde maa",
        contactEmailPlaceholder: "Email",
        contactSubjectPlaceholder: "Toɓɓere",
        contactMessagePlaceholder: "Winndu ɓatakuru maa...",
        contactSubmit: "Neldir",
        newsletterHeading: "📩 Winndito ngam habaru keso",
        newsletterPlaceholder: "Naatnu email maa",
        newsletterButton: "Winndito",
        footerText: "© 2026 M62 WEB TV NIGER | Powered by PDG MULTIMEDIA TV LTD",
        loadingEngagement: "Loading comments e ratings...",
        engagementName: "Innde maa (optional)",
        engagementMessage: "Winndu comment",
        engagementRate: "Hokku rating",
        noRating: "Alaa rating",
        send: "Neldir",
        noNewsYet: "Alaa habaru nde wallafaaka tawo.",
        noFeaturedNews: "Alaa habaru cuɓaaɗe tawo.",
        topStory: "HABARU MAWƊU",
        featured: "CUƁAAƊE",
        noFeaturedInCarousel: "Alaa habaru cuɓaaɗe tawo. Admin yo wallu habaru.",
        featuredNewsFallback: "Habaru cuɓaaɗe",
        noVideosYet: "Alaa video wallafaaka tawo.",
        watchVideo: "Yeƴtu video",
        newsImage: "Nataali habaru",
        videoThumbnail: "Nataali video",
        noGalleryYet: "Alaa nataali tawo. Ɓeydu nataali e admin.",
        noCommentsYet: "Alaa comments tawo.",
        anonymous: "Moo anndaa",
        avgRating: "Matsakaicin rating",
        ratings: "ratings",
        comments: "comments",
        feedbackFillAll: "Tiiɗno hebbin filaye fuu.",
        feedbackSendError: "Waawaa neldude ɓatakuru maa.",
        feedbackSent: "Ɓatakuru maa neldii e moƴƴi.",
        feedbackSendFailed: "Neldugol ɓatakuru yahii e joɓdi.",
        newsletterInvalid: "Tiiɗno naatnu email moƴƴo.",
        newsletterSuccess: "A jaaraama. Winndito moƴƴii."
    },
    ar: {
        headerTagline: "صوت الشعب 🇳🇪",
        languageLabel: "اللغة",
        searchPlaceholder: "🔍 ابحث عن الأخبار أو الفيديو...",
        searchButton: "بحث",
        navHome: "الرئيسية",
        navLive: "بث مباشر",
        navNews: "الأخبار",
        navFeatured: "المميزة",
        navPrograms: "البرامج",
        navVideos: "قائمة التلفزيون",
        navGallery: "الصور",
        navContact: "اتصل بنا",
        heroSubtitle: "صوت النيجر إلى العالم",
        heroTopics: "أخبار عاجلة • سياسة • اقتصاد • رياضة • ترفيه • بث مباشر",
        watchLiveButton: "🔴 شاهد البث",
        carouselHeading: "⭐ الأخبار المميزة",
        liveHeading: "🔴 بث مباشر",
        newsHeading: "📰 آخر الأخبار",
        featuredHeading: "⭐ الأخبار المميزة",
        featuredIntro: "أهم الأخبار المختارة من M62 WEB TV.",
        programsHeading: "📺 جدول البرامج",
        programsIntro: "البرامج اليومية الرئيسية على M62 WEB TV.",
        program1Title: "🎤 أخبار الصباح",
        program1Desc: "ملخص أخبار اليوم.",
        program2Title: "📰 تحليل الأخبار",
        program2Desc: "تحليل معمق لأهم الأحداث.",
        program3Title: "⚽ الرياضة",
        program3Desc: "نتائج وتحليلات الرياضة المحلية والدولية.",
        program4Title: "🌙 برنامج المساء",
        program4Desc: "برنامج المساء مع ضيوف متخصصين.",
        program5Title: "💼 الأعمال",
        program5Desc: "أخبار التجارة والاسواق ونصائح ريادة الأعمال.",
        program6Title: "🕌 الدين",
        program6Desc: "دروس دينية وتوجيهات روحية للمجتمع.",
        program7Title: "🎭 الترفيه",
        program7Desc: "برامج ترفيهية واخبار الفن والثقافة.",
        program8Title: "📚 التعليم",
        program8Desc: "فقرات تعليمية ودعم دراسي للطلاب.",
        program9Title: "🎙️ حوار مباشر",
        program9Desc: "نقاشات مباشرة مع ضيوف حول القضايا المهمة.",
        program10Title: "🏺 التاريخ",
        program10Desc: "قصص من تاريخ وتراث النيجر وافريقيا.",
        program11Title: "🧒 ركن الأطفال",
        program11Desc: "برامج آمنة وتعليمية مخصصة للأطفال الصغار.",
        program12Title: "❓ سؤال وجواب",
        program12Desc: "اسئلة الجمهور واجابات الخبراء.",
        program13Title: "⚖️ القانون والحقوق",
        program13Desc: "شرح مبسط للقانون وحقوق وواجبات المواطنين.",
        videosHeading: "🎬 قائمة الفيديو",
        galleryHeading: "🖼️ صور الأخبار",
        galleryIntro: "صور مختارة من الأخبار والفيديوهات.",
        contactHeading: "📞 اتصل بنا",
        contactHours: "🕒 الإثنين - السبت: 08:00 - 20:00",
        contactNamePlaceholder: "الاسم",
        contactEmailPlaceholder: "البريد الإلكتروني",
        contactSubjectPlaceholder: "الموضوع",
        contactMessagePlaceholder: "اكتب رسالتك...",
        contactSubmit: "إرسال",
        newsletterHeading: "📩 اشترك للحصول على أحدث الأخبار",
        newsletterPlaceholder: "أدخل بريدك الإلكتروني",
        newsletterButton: "اشتراك",
        footerText: "© 2026 M62 WEB TV NIGER | مدعوم من PDG MULTIMEDIA TV LTD",
        loadingEngagement: "جار تحميل التعليقات والتقييمات...",
        engagementName: "اسمك (اختياري)",
        engagementMessage: "اكتب تعليقًا",
        engagementRate: "قيّم هذا المحتوى",
        noRating: "لا يوجد تقييم",
        send: "إرسال",
        noNewsYet: "لا توجد أخبار منشورة حاليًا.",
        noFeaturedNews: "لا توجد أخبار مميزة حاليًا.",
        topStory: "الخبر الرئيسي",
        featured: "مميز",
        noFeaturedInCarousel: "لا توجد أخبار مميزة حاليًا. يرجى النشر من لوحة الإدارة.",
        featuredNewsFallback: "خبر مميز",
        noVideosYet: "لا توجد فيديوهات منشورة حاليًا.",
        watchVideo: "شاهد الفيديو",
        newsImage: "صورة الخبر",
        videoThumbnail: "صورة مصغرة للفيديو",
        noGalleryYet: "لا توجد صور متاحة حاليًا. أضف صورًا من لوحة الإدارة.",
        noCommentsYet: "لا توجد تعليقات بعد.",
        anonymous: "مجهول",
        avgRating: "متوسط التقييم",
        ratings: "تقييمات",
        comments: "تعليقات",
        feedbackFillAll: "يرجى ملء جميع الحقول.",
        feedbackSendError: "حدثت مشكلة أثناء إرسال الرسالة.",
        feedbackSent: "تم إرسال رسالتك بنجاح.",
        feedbackSendFailed: "تعذر إرسال الرسالة الآن.",
        newsletterInvalid: "يرجى إدخال بريد إلكتروني صحيح.",
        newsletterSuccess: "شكرًا لك. تم الاشتراك بنجاح."
    }
};

function tr(key) {
    const langPack = I18N[currentLanguage] || I18N[DEFAULT_LANGUAGE];
    if (langPack && Object.prototype.hasOwnProperty.call(langPack, key)) {
        return langPack[key];
    }

    return (I18N[DEFAULT_LANGUAGE] && I18N[DEFAULT_LANGUAGE][key]) || key;
}

function applyPageTranslations() {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach((node) => {
        const key = node.getAttribute("data-i18n");
        if (key) {
            node.textContent = tr(key);
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
        const key = node.getAttribute("data-i18n-placeholder");
        if (key) {
            node.setAttribute("placeholder", tr(key));
        }
    });
}

function initializeLanguageSelector() {
    const saved = String(localStorage.getItem("m62Language") || DEFAULT_LANGUAGE).toLowerCase();
    currentLanguage = SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;

    const select = document.getElementById("languageSelect");
    if (select) {
        select.value = currentLanguage;

        select.addEventListener("change", async () => {
            const chosen = String(select.value || DEFAULT_LANGUAGE).toLowerCase();
            currentLanguage = SUPPORTED_LANGUAGES.includes(chosen) ? chosen : DEFAULT_LANGUAGE;
            localStorage.setItem("m62Language", currentLanguage);

            applyPageTranslations();

            if (!isAdminPage()) {
                await initializeHomePage();
            }
        });
    }

    applyPageTranslations();
}

const moderationState = {
    page: 1,
    pageSize: 25,
    query: "",
    status: "all",
    totalPages: 1,
    selected: new Set()
};
const adminEditorState = {
    newsId: "",
    videoId: "",
    newsItems: [],
    videoItems: []
};

class ApiError extends Error {
    constructor(message, status, retryAfterSeconds = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

function makeClientId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStore(key, fallbackValue) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
        return fallbackValue;
    }
}

function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function createDebouncedFunction(callback, delayMs = 320) {
    let timeoutId = null;

    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            callback(...args);
        }, delayMs);
    };
}

function getLocalVisitorCount() {
    return Number(localStorage.getItem("m62VisitorCount") || "0");
}

function setLocalVisitorCount(value) {
    localStorage.setItem("m62VisitorCount", String(Math.max(Number(value || 0), 0)));
}

async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats/dashboard`);

        if (!response.ok) {
            throw new Error("Dashboard stats request failed");
        }

        const payload = await response.json();
        return payload.data || {};
    } catch (error) {
        return {
            newsCount: 0,
            videosCount: 0,
            usersCount: 0,
            commentsCount: 0,
            ratingsCount: 0,
            engagementCount: 0,
            visitorsCount: getLocalVisitorCount()
        };
    }
}

async function updateDashboardStats() {
    const totalNews = document.getElementById("totalNews");
    const totalVideos = document.getElementById("totalVideos");
    const totalVisitors = document.getElementById("totalVisitors");
    const totalUsers = document.getElementById("totalUsers");
    const totalComments = document.getElementById("totalComments");
    const totalEngagement = document.getElementById("totalEngagement");

    const stats = await fetchDashboardStats();

    if (totalNews) {
        totalNews.innerText = String(stats.newsCount || 0);
    }

    if (totalVideos) {
        totalVideos.innerText = String(stats.videosCount || 0);
    }

    if (totalVisitors) {
        totalVisitors.innerText = String(stats.visitorsCount || 0);
    }

    if (totalUsers) {
        totalUsers.innerText = String(stats.usersCount || 0);
    }

    if (totalComments) {
        totalComments.innerText = String(stats.commentsCount || 0);
    }

    if (totalEngagement) {
        totalEngagement.innerText = String(stats.engagementCount || 0);
    }

    renderAdminDashboardProfile();
}

async function incrementVisitorCounterIfPublicPage() {
    if (typeof window === "undefined") {
        return;
    }

    const path = String(window.location.pathname || "").toLowerCase();
    const isAdminPage = path.includes("/admin/");

    if (isAdminPage) {
        return;
    }

    const sessionKey = "m62VisitorCounted";
    if (sessionStorage.getItem(sessionKey) === "1") {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/stats/visit`, {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Visitor tracking failed");
        }

        const payload = await response.json();
        setLocalVisitorCount(payload?.data?.visitorsCount || 0);
    } catch (error) {
        setLocalVisitorCount(getLocalVisitorCount() + 1);
    }

    sessionStorage.setItem(sessionKey, "1");
}

function ensureContentIds() {
    const news = readStore("news", []);
    const videos = readStore("videos", []);
    let newsChanged = false;
    let videosChanged = false;

    news.forEach((item, index) => {
        if (!item.id) {
            item.id = `news_${index + 1}`;
            newsChanged = true;
        }
    });

    videos.forEach((item, index) => {
        if (!item.id) {
            item.id = `video_${index + 1}`;
            videosChanged = true;
        }
    });

    if (newsChanged) {
        writeStore("news", news);
    }

    if (videosChanged) {
        writeStore("videos", videos);
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isAdminPage() {
    if (typeof window === "undefined") {
        return false;
    }

    return String(window.location.pathname || "").toLowerCase().includes("/admin/");
}

function redirectToAdminLogin(reason = "") {
    if (typeof window === "undefined") {
        return;
    }

    const currentPath = String(window.location.pathname || "").toLowerCase();
    const loginPath = currentPath.includes("/admin/")
        ? currentPath.replace(/[^/]+$/, "login.html")
        : "admin/login.html";

    if (currentPath.endsWith("/login.html") || currentPath.endsWith("\\login.html") || currentPath.endsWith("login.html")) {
        return;
    }

    if (reason) {
        sessionStorage.setItem("m62AdminLoginMessage", reason);
    }

    window.location.href = loginPath;
}

function setEngagementFeedback(form, message, tone) {
    const feedback = form.querySelector(".engagement-feedback");

    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.classList.remove("is-error", "is-success", "is-warning");

    if (tone === "error") {
        feedback.classList.add("is-error");
    }

    if (tone === "success") {
        feedback.classList.add("is-success");
    }

    if (tone === "warning") {
        feedback.classList.add("is-warning");
    }
}

async function parseApiError(response, fallbackMessage) {
    const payload = await response.json().catch(() => ({}));
    const retryAfterHeader = Number(response.headers.get("Retry-After") || 0);
    const retryAfterSeconds = Number(payload.retryAfterSeconds || retryAfterHeader || 0);
    const message = payload.message || fallbackMessage;

    if (isAdminPage() && (response.status === 401 || response.status === 403) && !String(window.location.pathname || "").toLowerCase().endsWith("login.html")) {
        clearAdminAuthSession();
        redirectToAdminLogin("Your admin session expired. Please sign in again.");
    }

    return new ApiError(message, response.status, retryAfterSeconds);
}

function normalizeLegacyNewsItem(item, index) {
    const content = String(item.content || "").trim();
    const summary = String(item.summary || content.slice(0, 180) || "No summary");
    const id = item.id || `news_${index + 1}`;
    return {
        id,
        title: String(item.title || "Untitled"),
        slug: String(item.slug || id),
        summary,
        content,
        category: String(item.category || "General"),
        coverImageUrl: String(item.coverImageUrl || ""),
        status: String(item.status || "published"),
        publishedAt: item.publishedAt || item.date || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null
    };
}

async function fetchNewsList(options = {}) {
    const {
        status = "published",
        page = 1,
        pageSize = 20,
        q = "",
        category = ""
    } = options;

    try {
        const params = new URLSearchParams({
            status,
            page: String(page),
            pageSize: String(pageSize),
            q: String(q || ""),
            category: String(category || "")
        });
        const response = await fetch(`${API_BASE_URL}/api/news?${params.toString()}`);

        if (!response.ok) {
            throw new Error("News API request failed");
        }

        const payload = await response.json();
        return {
            data: Array.isArray(payload.data) ? payload.data : [],
            meta: payload.meta || null,
            source: "api"
        };
    } catch (error) {
        const localNews = readStore("news", []).map(normalizeLegacyNewsItem);
        const filtered = status === "all"
            ? localNews
            : localNews.filter((item) => item.status === status);

        return {
            data: filtered,
            meta: null,
            source: "fallback"
        };
    }
}

function formatNewsDate(value) {
    if (!value) {
        return "-";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleDateString();
}

async function createNewsItem(payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/news`, {
        method: "POST",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to create news item");
    }

    return response.json();
}

async function updateNewsItem(newsId, payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(newsId)}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to update news item");
    }

    return response.json();
}

async function deleteNewsItem(newsId) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(newsId)}`, {
        method: "DELETE",
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to delete news item");
    }

    return response.json();
}

async function uploadNewsImageFile(file) {
    ensureAdminCredentialAvailable();

    if (!file) {
        throw new Error("Choose an image file first.");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/api/uploads/image`, {
        method: "POST",
        headers: buildAdminRequestHeaders(false),
        body: formData
    });

    if (!response.ok) {
        throw await parseApiError(response, "Image upload failed");
    }

    const payload = await response.json();
    return payload?.data || {};
}

async function publishNews() {
    const title = String(document.getElementById("newsTitle")?.value || "").trim();
    const summary = String(document.getElementById("newsSummary")?.value || "").trim();
    const category = String(document.getElementById("newsCategory")?.value || "General").trim();
    const status = String(document.getElementById("newsStatus")?.value || "published").trim();
    const coverImageUrl = String(document.getElementById("newsCoverImage")?.value || "").trim();
    const content = String(document.getElementById("newsContent")?.value || "").trim();

    if (!title || !summary || !content) {
        alert("Title, summary, and content are required.");
        return;
    }

    const isEditing = Boolean(adminEditorState.newsId);

    try {
        const payload = {
            title,
            summary,
            category: category || "General",
            status,
            coverImageUrl,
            content,
            tags: []
        };

        if (isEditing) {
            await updateNewsItem(adminEditorState.newsId, payload);
        } else {
            await createNewsItem(payload);
        }

        alert(isEditing ? "News updated successfully" : "News published successfully");
        resetNewsEditor();

        await loadAdminNewsTable();
        await loadNews();
    } catch (error) {
        alert(error.message || (isEditing ? "Unable to update news" : "Unable to publish news"));
    }
}

function resetNewsEditor() {
    adminEditorState.newsId = "";
    const contentInput = document.getElementById("newsContent");
    const summaryInput = document.getElementById("newsSummary");
    const titleInput = document.getElementById("newsTitle");
    const imageInput = document.getElementById("newsCoverImage");
    const categoryInput = document.getElementById("newsCategory");
    const statusInput = document.getElementById("newsStatus");
    const publishButton = document.getElementById("publishNewsButton");
    const cancelButton = document.getElementById("cancelNewsEditButton");

    if (contentInput) contentInput.value = "";
    if (summaryInput) summaryInput.value = "";
    if (titleInput) titleInput.value = "";
    if (imageInput) imageInput.value = "";
    if (categoryInput) categoryInput.value = "General";
    if (statusInput) statusInput.value = "published";
    if (publishButton) publishButton.textContent = "Publish News";
    if (cancelButton) cancelButton.style.display = "none";
}

function beginNewsEdit(newsId) {
    const item = adminEditorState.newsItems.find((entry) => entry.id === newsId);

    if (!item) {
        alert("Unable to load selected news item.");
        return;
    }

    adminEditorState.newsId = newsId;
    const titleInput = document.getElementById("newsTitle");
    const summaryInput = document.getElementById("newsSummary");
    const categoryInput = document.getElementById("newsCategory");
    const statusInput = document.getElementById("newsStatus");
    const imageInput = document.getElementById("newsCoverImage");
    const contentInput = document.getElementById("newsContent");
    const publishButton = document.getElementById("publishNewsButton");
    const cancelButton = document.getElementById("cancelNewsEditButton");

    if (titleInput) titleInput.value = item.title || "";
    if (summaryInput) summaryInput.value = item.summary || "";
    if (categoryInput) categoryInput.value = item.category || "General";
    if (statusInput) statusInput.value = item.status || "published";
    if (imageInput) imageInput.value = item.coverImageUrl || "";
    if (contentInput) contentInput.value = item.content || "";
    if (publishButton) publishButton.textContent = "Update News";
    if (cancelButton) cancelButton.style.display = "inline-block";
}

async function loadNews() {
    const result = await fetchNewsList({ status: "all", pageSize: 200 });
    const news = result.data || [];
    const table = document.getElementById("latestNews");

    updateDashboardStats();

    if (!table) {
        return;
    }

    table.innerHTML = "";

    news.slice(0, 10).forEach((item) => {
        table.innerHTML += `
<tr>
<td>${escapeHtml(item.title)}</td>
<td>${escapeHtml(formatNewsDate(item.publishedAt || item.createdAt))}</td>
<td>${escapeHtml(item.status || "published")}</td>
</tr>
`;
    });
}

function renderAdminNewsRows(items) {
    if (!items.length) {
        return `
<tr>
    <td colspan="5">No news items found.</td>
</tr>
`;
    }

    return items.map((item) => `
<tr>
    <td>${escapeHtml(item.title)}</td>
    <td>${escapeHtml(item.category || "General")}</td>
    <td>${escapeHtml(item.status || "published")}</td>
    <td>${escapeHtml(formatNewsDate(item.publishedAt || item.createdAt))}</td>
    <td>
        <button type="button" data-news-edit-id="${escapeHtml(item.id)}">Edit</button>
        <button type="button" data-news-delete-id="${escapeHtml(item.id)}">Delete</button>
    </td>
</tr>
`).join("");
}

function getAdminNewsFilteredItems() {
    const searchInput = document.getElementById("adminNewsSearch");
    const statusFilter = document.getElementById("adminNewsStatusFilter");
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const status = String(statusFilter?.value || "all").trim().toLowerCase();

    return adminEditorState.newsItems.filter((item) => {
        const itemStatus = String(item.status || "published").toLowerCase();
        const matchesStatus = status === "all" || itemStatus === status;

        if (!matchesStatus) {
            return false;
        }

        if (!query) {
            return true;
        }

        const haystack = [
            String(item.title || ""),
            String(item.category || ""),
            String(item.summary || "")
        ].join(" ").toLowerCase();

        return haystack.includes(query);
    });
}

function renderAdminNewsTableFromState() {
    const tableBody = document.getElementById("adminNewsTableBody");

    if (!tableBody) {
        return;
    }

    const filteredItems = getAdminNewsFilteredItems();
    tableBody.innerHTML = renderAdminNewsRows(filteredItems);
}

async function loadAdminNewsTable() {
    const tableBody = document.getElementById("adminNewsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "<tr><td colspan=\"5\">Loading...</td></tr>";

    const result = await fetchNewsList({ status: "all", pageSize: 100 });
    adminEditorState.newsItems = result.data || [];
    renderAdminNewsTableFromState();
}

function normalizeLegacyVideoItem(item, index) {
    const id = item.id || `video_${index + 1}`;
    return {
        id,
        title: String(item.title || "Untitled video"),
        description: String(item.description || "No description"),
        category: String(item.category || "General"),
        status: String(item.status || "published"),
        sourceType: String(item.sourceType || "external"),
        videoUrl: String(item.videoUrl || item.link || ""),
        thumbnailUrl: String(item.thumbnailUrl || ""),
        publishedAt: item.publishedAt || null,
        createdAt: item.createdAt || null
    };
}

async function fetchVideosList(options = {}) {
    const {
        status = "published",
        page = 1,
        pageSize = 20,
        q = "",
        category = ""
    } = options;

    try {
        const params = new URLSearchParams({
            status,
            page: String(page),
            pageSize: String(pageSize),
            q: String(q || ""),
            category: String(category || "")
        });
        const response = await fetch(`${API_BASE_URL}/api/videos?${params.toString()}`);

        if (!response.ok) {
            throw new Error("Video API request failed");
        }

        const payload = await response.json();
        return {
            data: Array.isArray(payload.data) ? payload.data : [],
            source: "api"
        };
    } catch (error) {
        const videos = readStore("videos", []).map(normalizeLegacyVideoItem);
        const filtered = status === "all"
            ? videos
            : videos.filter((item) => item.status === status);

        return {
            data: filtered,
            source: "fallback"
        };
    }
}

async function createVideoItem(payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/videos`, {
        method: "POST",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to create video item");
    }

    return response.json();
}

async function updateVideoItem(videoId, payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/videos/${encodeURIComponent(videoId)}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to update video item");
    }

    return response.json();
}

async function deleteVideoItem(videoId) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/videos/${encodeURIComponent(videoId)}`, {
        method: "DELETE",
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to delete video item");
    }

    return response.json();
}

async function uploadVideoFile(file) {
    ensureAdminCredentialAvailable();

    if (!file) {
        throw new Error("Choose a video file first.");
    }

    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch(`${API_BASE_URL}/api/uploads/video`, {
        method: "POST",
        headers: buildAdminRequestHeaders(false),
        body: formData
    });

    if (!response.ok) {
        throw await parseApiError(response, "Video upload failed");
    }

    const payload = await response.json();
    return payload?.data || {};
}

async function fetchUsersList(options = {}) {
    ensureAdminCredentialAvailable();
    const params = new URLSearchParams({
        q: String(options.q || ""),
        role: String(options.role || ""),
        status: String(options.status || ""),
        page: String(options.page || 1),
        pageSize: String(options.pageSize || 100)
    });

    const response = await fetch(`${API_BASE_URL}/api/auth/users?${params.toString()}`, {
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to load users");
    }

    const payload = await response.json();
    return payload.data || [];
}

async function createUserAccount(payload) {
    ensureAdminCredentialAvailable();
    const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: "POST",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to create user");
    }

    return response.json();
}

async function updateUserAccount(userId, payload) {
    ensureAdminCredentialAvailable();
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to update user");
    }

    return response.json();
}

async function resetUserPassword(userId, password) {
    ensureAdminCredentialAvailable();
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${encodeURIComponent(userId)}/password`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify({ password })
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to reset password");
    }

    return response.json();
}

function renderUsersRows(users) {
    if (!users.length) {
        return `
<tr>
    <td colspan="6">No users found.</td>
</tr>
`;
    }

    return users.map((user) => `
<tr>
    <td>${escapeHtml(user.name || "-")}</td>
    <td>${escapeHtml(user.email || "-")}</td>
    <td>${escapeHtml(user.role || "-")}</td>
    <td>${user.isActive ? "Active" : "Inactive"}</td>
    <td>${escapeHtml(user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never")}</td>
    <td>
        <div class="user-actions">
            <button type="button" data-user-action="toggle-status" data-user-id="${escapeHtml(user.id)}" data-user-active="${user.isActive ? "1" : "0"}">${user.isActive ? "Deactivate" : "Activate"}</button>
            <button type="button" data-user-action="promote-admin" data-user-id="${escapeHtml(user.id)}">Make Admin</button>
            <button type="button" data-user-action="set-editor" data-user-id="${escapeHtml(user.id)}">Set Editor</button>
            <button type="button" data-user-action="reset-password" data-user-id="${escapeHtml(user.id)}">Reset Password</button>
        </div>
    </td>
</tr>
`).join("");
}

async function publishVideo() {
    const title = String(document.getElementById("videoTitle")?.value || "").trim();
    const description = String(document.getElementById("videoDescription")?.value || "").trim();
    const category = String(document.getElementById("videoCategory")?.value || "General").trim();
    const status = String(document.getElementById("videoStatus")?.value || "published").trim();
    const videoUrl = String(document.getElementById("videoLink")?.value || "").trim();
    const thumbnailUrl = String(document.getElementById("videoThumbnailUrl")?.value || "").trim();
    const sourceType = videoUrl.includes('/uploads/') ? "upload" : "external";

    if (!title || !description || !videoUrl) {
        alert("Title, description, and video URL are required.");
        return;
    }

    const isEditing = Boolean(adminEditorState.videoId);

    try {
        const payload = {
            title,
            description,
            category: category || "General",
            status,
            sourceType,
            videoUrl,
            thumbnailUrl
        };

        if (isEditing) {
            await updateVideoItem(adminEditorState.videoId, payload);
        } else {
            await createVideoItem(payload);
        }

        alert(isEditing ? "Video updated successfully" : "Video published successfully");
        resetVideoEditor();

        await loadVideos();
        await renderHomeVideos();
    } catch (error) {
        alert(error.message || (isEditing ? "Unable to update video" : "Unable to publish video"));
    }
}

function resetVideoEditor() {
    adminEditorState.videoId = "";
    const titleInput = document.getElementById("videoTitle");
    const descriptionInput = document.getElementById("videoDescription");
    const categoryInput = document.getElementById("videoCategory");
    const statusInput = document.getElementById("videoStatus");
    const videoInput = document.getElementById("videoLink");
    const thumbnailInput = document.getElementById("videoThumbnailUrl");
    const publishButton = document.getElementById("publishVideoButton");
    const cancelButton = document.getElementById("cancelVideoEditButton");

    if (titleInput) titleInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    if (categoryInput) categoryInput.value = "General";
    if (statusInput) statusInput.value = "published";
    if (videoInput) videoInput.value = "";
    if (thumbnailInput) thumbnailInput.value = "";
    if (publishButton) publishButton.textContent = "Publish Video";
    if (cancelButton) cancelButton.style.display = "none";
}

function beginVideoEdit(videoId) {
    const item = adminEditorState.videoItems.find((entry) => entry.id === videoId);

    if (!item) {
        alert("Unable to load selected video item.");
        return;
    }

    adminEditorState.videoId = videoId;
    const titleInput = document.getElementById("videoTitle");
    const descriptionInput = document.getElementById("videoDescription");
    const categoryInput = document.getElementById("videoCategory");
    const statusInput = document.getElementById("videoStatus");
    const videoInput = document.getElementById("videoLink");
    const thumbnailInput = document.getElementById("videoThumbnailUrl");
    const publishButton = document.getElementById("publishVideoButton");
    const cancelButton = document.getElementById("cancelVideoEditButton");

    if (titleInput) titleInput.value = item.title || "";
    if (descriptionInput) descriptionInput.value = item.description || "";
    if (categoryInput) categoryInput.value = item.category || "General";
    if (statusInput) statusInput.value = item.status || "published";
    if (videoInput) videoInput.value = item.videoUrl || "";
    if (thumbnailInput) thumbnailInput.value = item.thumbnailUrl || "";
    if (publishButton) publishButton.textContent = "Update Video";
    if (cancelButton) cancelButton.style.display = "inline-block";
}

async function loadVideos() {
    const result = await fetchVideosList({ status: "all", pageSize: 100 });
    const videos = result.data || [];
    const table = document.getElementById("videoTable");

    updateDashboardStats();

    if (!table) {
        return;
    }

    adminEditorState.videoItems = videos;
    renderAdminVideosTableFromState();
}

function renderAdminVideoRows(items) {
    if (!items.length) {
        return `
<tr>
    <td colspan="5">No videos found.</td>
</tr>
`;
    }

    return items.map((video) => `
<tr>
    <td>${escapeHtml(video.title)}</td>
    <td>${escapeHtml(video.category || "General")}</td>
    <td>${escapeHtml(video.status || "published")}</td>
    <td>${escapeHtml(video.sourceType || "external")}</td>
    <td>
        <button type="button" data-video-edit-id="${escapeHtml(video.id)}">Edit</button>
        <button type="button" data-video-delete-id="${escapeHtml(video.id)}">Delete</button>
    </td>
</tr>
`).join("");
}

function getAdminVideosFilteredItems() {
    const searchInput = document.getElementById("adminVideoSearch");
    const statusFilter = document.getElementById("adminVideoStatusFilter");
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const status = String(statusFilter?.value || "all").trim().toLowerCase();

    return adminEditorState.videoItems.filter((video) => {
        const itemStatus = String(video.status || "published").toLowerCase();
        const matchesStatus = status === "all" || itemStatus === status;

        if (!matchesStatus) {
            return false;
        }

        if (!query) {
            return true;
        }

        const haystack = [
            String(video.title || ""),
            String(video.category || ""),
            String(video.sourceType || ""),
            String(video.description || "")
        ].join(" ").toLowerCase();

        return haystack.includes(query);
    });
}

function renderAdminVideosTableFromState() {
    const table = document.getElementById("videoTable");

    if (!table) {
        return;
    }

    const filteredVideos = getAdminVideosFilteredItems();
    table.innerHTML = renderAdminVideoRows(filteredVideos);
}

function saveLiveTV() {
    const url = document.getElementById("liveUrl").value;
    const status = document.getElementById("liveStatus").value;

    if (url === "") {
        alert("Please paste Live Stream URL");
        return;
    }

    writeStore("liveTV", { url, status });
    alert("Live TV Saved Successfully");
    window.location.href = "livetv.html";
}

function loadLiveTV() {
    const liveTV = readStore("liveTV", null);
    const table = document.getElementById("liveTable");
    const liveUrlInput = document.getElementById("liveUrl");
    const liveStatusInput = document.getElementById("liveStatus");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (liveTV) {
        if (liveUrlInput) {
            liveUrlInput.value = String(liveTV.url || "");
        }

        if (liveStatusInput) {
            liveStatusInput.value = String(liveTV.status || "OFFLINE");
        }

        table.innerHTML = `
        <tr>
            <td>${liveTV.url}</td>
            <td>${liveTV.status}</td>
        </tr>
        `;
    } else if (liveStatusInput) {
        liveStatusInput.value = "OFFLINE";
    }
}

function loadHomeLiveTV() {
    const liveTV = readStore("liveTV", null);
    const iframe = document.getElementById("homeLiveTV");

    if (!iframe) {
        return;
    }

    const videoBox = iframe.closest(".video-box");
    if (videoBox) {
        const existingHint = videoBox.querySelector(".data-saver-live-hint");
        if (existingHint) {
            existingHint.remove();
        }
    }

    if (DATA_SAVER_ENABLED) {
        iframe.removeAttribute("src");

        if (videoBox && liveTV && liveTV.url) {
            const hint = document.createElement("p");
            hint.className = "data-saver-live-hint";
            hint.innerHTML = `Data saver is ON. <a href="${escapeHtml(liveTV.url)}" target="_blank" rel="noopener noreferrer">Open live stream</a>`;
            videoBox.appendChild(hint);
        }

        return;
    }

    if (liveTV && liveTV.url) {
        iframe.src = liveTV.url;
    }
}

function buildEngagementFallbackKey(itemType, itemId) {
    return `engagement_${itemType}_${itemId}`;
}

function getFallbackEngagement(itemType, itemId) {
    return readStore(buildEngagementFallbackKey(itemType, itemId), {
        comments: [],
        ratings: []
    });
}

function saveFallbackEngagement(itemType, itemId, data) {
    writeStore(buildEngagementFallbackKey(itemType, itemId), data);
}

async function getEngagement(itemType, itemId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}`);

        if (!response.ok) {
            throw new Error("Failed request");
        }

        const payload = await response.json();
        return payload.data;
    } catch (error) {
        const fallback = getFallbackEngagement(itemType, itemId);
        const ratingsCount = fallback.ratings.length;
        const ratingsTotal = fallback.ratings.reduce((sum, value) => sum + value, 0);

        return {
            summary: {
                averageRating: ratingsCount ? Number((ratingsTotal / ratingsCount).toFixed(1)) : 0,
                ratingsCount,
                commentsCount: fallback.comments.length
            },
            comments: [...fallback.comments].reverse().slice(0, 20)
        };
    }
}

async function createComment(itemType, itemId, name, message) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, message })
        });

        if (!response.ok) {
            throw await parseApiError(response, "Comment submit failed");
        }

        return { source: "api" };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        const fallback = getFallbackEngagement(itemType, itemId);
        fallback.comments.push({
            id: Date.now().toString(),
            name: name || "Anonymous",
            message,
            createdAt: new Date().toISOString()
        });
        saveFallbackEngagement(itemType, itemId, fallback);
        return { source: "fallback" };
    }
}

async function createRating(itemType, itemId, rating) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}/ratings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ rating })
        });

        if (!response.ok) {
            throw await parseApiError(response, "Rating submit failed");
        }

        return { source: "api" };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        const fallback = getFallbackEngagement(itemType, itemId);
        fallback.ratings.push(rating);
        saveFallbackEngagement(itemType, itemId, fallback);
        return { source: "fallback" };
    }
}

function renderEngagementWidget(itemType, itemId) {
    return `
<div class="engagement-widget" data-item-type="${itemType}" data-item-id="${itemId}">
    <div class="engagement-summary">${escapeHtml(tr("loadingEngagement"))}</div>
    <form class="engagement-form" data-item-type="${itemType}" data-item-id="${itemId}">
        <input type="text" name="name" placeholder="${escapeHtml(tr("engagementName"))}">
        <textarea name="message" rows="3" placeholder="${escapeHtml(tr("engagementMessage"))}"></textarea>
        <label>
            ${escapeHtml(tr("engagementRate"))}
            <select name="rating">
                <option value="">${escapeHtml(tr("noRating"))}</option>
                <option value="1">1 star</option>
                <option value="2">2 stars</option>
                <option value="3">3 stars</option>
                <option value="4">4 stars</option>
                <option value="5">5 stars</option>
            </select>
        </label>
        <button type="submit">${escapeHtml(tr("send"))}</button>
        <p class="engagement-feedback" aria-live="polite"></p>
    </form>
    <div class="engagement-comments"></div>
</div>
`;
}

async function renderHomeNews() {
    const container = document.getElementById("homeNews");
    const defaultCover = "assets/images/banner.png";

    if (!container) {
        return;
    }

    const result = await fetchNewsList({ status: "published", pageSize: HOME_NEWS_PAGE_SIZE });
    const news = result.data || [];

    if (!news.length) {
        container.innerHTML = `<p>${escapeHtml(tr("noNewsYet"))}</p>`;
        return;
    }

    container.innerHTML = news.map((item, index) => `
<article class="news-card">
    <img class="news-cover" loading="lazy" decoding="async" src="${escapeHtml(item.coverImageUrl || defaultCover)}" alt="${escapeHtml(item.title)}">
    <h3>${escapeHtml(item.title)}</h3>
    <p><strong>Date:</strong> ${escapeHtml(formatNewsDate(item.publishedAt || item.createdAt))}</p>
    <p>${escapeHtml(item.summary || item.content || "")}</p>
    ${DATA_SAVER_ENABLED ? "" : renderEngagementWidget("news", item.id || `news_${index + 1}`)}
</article>
`).join("");
}

async function renderFeaturedNews() {
    const container = document.getElementById("featuredNews");
    const defaultCover = "assets/images/banner.png";

    if (!container) {
        return;
    }

    const result = await fetchNewsList({ status: "published", pageSize: HOME_FEATURED_PAGE_SIZE });
    const news = (result.data || []).slice(0, 4);

    if (!news.length) {
        container.innerHTML = `<p>${escapeHtml(tr("noFeaturedNews"))}</p>`;
        return;
    }

    container.innerHTML = news.map((item, index) => `
<article class="featured-card">
    <span class="featured-badge">${index === 0 ? escapeHtml(tr("topStory")) : escapeHtml(tr("featured"))}</span>
    <img class="featured-cover" loading="lazy" decoding="async" src="${escapeHtml(item.coverImageUrl || defaultCover)}" alt="${escapeHtml(item.title)}">
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.summary || item.content || "")}</p>
</article>
`).join("");
}

let homeCarouselIndex = 0;
let homeCarouselItems = [];

function updateFeaturedCarouselPosition() {
    const track = document.getElementById("featuredCarouselTrack");
    if (!track || !homeCarouselItems.length) {
        return;
    }

    track.style.transform = `translateX(-${homeCarouselIndex * 100}%)`;
}

function initializeFeaturedCarouselControls() {
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (!homeCarouselItems.length) {
                return;
            }
            homeCarouselIndex = (homeCarouselIndex - 1 + homeCarouselItems.length) % homeCarouselItems.length;
            updateFeaturedCarouselPosition();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (!homeCarouselItems.length) {
                return;
            }
            homeCarouselIndex = (homeCarouselIndex + 1) % homeCarouselItems.length;
            updateFeaturedCarouselPosition();
        });
    }
}

async function renderFeaturedCarousel() {
    const track = document.getElementById("featuredCarouselTrack");

    if (!track) {
        return;
    }

    const result = await fetchNewsList({ status: "published", pageSize: HOME_CAROUSEL_PAGE_SIZE });
    homeCarouselItems = (result.data || []).slice(0, 4);

    if (!homeCarouselItems.length) {
        track.innerHTML = `
<article class="carousel-item">
    <h3>M62 WEB TV</h3>
    <p>${escapeHtml(tr("noFeaturedInCarousel"))}</p>
</article>`;
        homeCarouselIndex = 0;
        updateFeaturedCarouselPosition();
        return;
    }

    track.innerHTML = homeCarouselItems.map((item) => `
<article class="carousel-item">
    <h3>${escapeHtml(item.title || tr("featuredNewsFallback"))}</h3>
    <p>${escapeHtml(item.summary || item.content || "")}</p>
</article>
`).join("");

    homeCarouselIndex = 0;
    updateFeaturedCarouselPosition();
}

function initializeHomeSearch() {
    const input = document.getElementById("homeSearchInput");
    const button = document.getElementById("homeSearchButton");

    if (!input || !button) {
        return;
    }

    const runSearch = () => {
        const query = String(input.value || "").trim().toLowerCase();
        const selectors = [
            ".news-card",
            ".featured-card",
            ".video-card",
            ".gallery-card"
        ];

        const cards = document.querySelectorAll(selectors.join(","));
        let firstMatch = null;

        cards.forEach((card) => {
            const text = String(card.textContent || "").toLowerCase();
            const matched = !query || text.includes(query);
            card.style.display = matched ? "" : "none";

            if (!firstMatch && matched) {
                firstMatch = card;
            }
        });

        if (query && firstMatch) {
            firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    button.addEventListener("click", runSearch);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            runSearch();
        }
    });
}

function getBreakingTickerFallbackItems() {
    return [
        "Niamey Headlines: Politics, Economy, Security and Community Updates",
        "Live Desk: 24/7 Multilingual Coverage in Hausa, French, English and Arabic",
        "Sports Now: Regional football analysis and international match reports",
        "Special Report: Youth, Innovation and Digital Media in Niger",
        "Watch Live: Stay connected with M62 WEB TV global audience feed"
    ];
}

function buildBreakingTickerMarkup(items) {
    return items.map((text) => `<span>${escapeHtml(text)}</span>`).join("");
}

function normalizeBreakingTickerItems(newsItems) {
    return (newsItems || [])
        .map((item) => String(item.title || item.summary || item.content || "").trim())
        .filter(Boolean)
        .slice(0, 10);
}

async function renderBreakingTicker() {
    const primaryTrack = document.getElementById("breakingTickerTrackPrimary");
    const secondaryTrack = document.getElementById("breakingTickerTrackSecondary");

    if (!primaryTrack || !secondaryTrack) {
        return;
    }

    let tickerItems = [];

    try {
        const result = await fetchNewsList({ status: "published", pageSize: HOME_TICKER_PAGE_SIZE });
        tickerItems = normalizeBreakingTickerItems(result.data);
    } catch (error) {
        tickerItems = [];
    }

    if (!tickerItems.length) {
        tickerItems = getBreakingTickerFallbackItems();
    }

    const markup = buildBreakingTickerMarkup(tickerItems);
    primaryTrack.innerHTML = markup;
    secondaryTrack.innerHTML = markup;
}

async function renderHomeVideos() {
    const container = document.getElementById("homeVideos");

    if (!container) {
        return;
    }

    const result = await fetchVideosList({ status: "published", pageSize: HOME_VIDEOS_PAGE_SIZE });
    const videos = result.data || [];

    if (!videos.length) {
        container.innerHTML = `<p>${escapeHtml(tr("noVideosYet"))}</p>`;
        return;
    }

    container.innerHTML = videos.map((video, index) => `
<article class="video-card">
    ${video.thumbnailUrl ? `<img class="news-cover" loading="lazy" decoding="async" src="${escapeHtml(video.thumbnailUrl)}" alt="${escapeHtml(video.title)}">` : ""}
    <h3>${escapeHtml(video.title)}</h3>
    <p>${escapeHtml(video.description || "")}</p>
    ${(video.videoUrl && video.videoUrl.includes('/uploads/') && !DATA_SAVER_ENABLED)
        ? `<video controls style="width:100%;max-height:240px;" src="${escapeHtml(video.videoUrl)}"></video>`
        : `<p><a href="${escapeHtml(video.videoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(tr("watchVideo"))}</a></p>`}
    ${DATA_SAVER_ENABLED ? "" : renderEngagementWidget("video", video.id || `video_${index + 1}`)}
</article>
`).join("");
}

async function renderHomeGallery() {
    const container = document.getElementById("homeGallery");

    if (!container) {
        return;
    }

    const [newsResult, videoResult] = await Promise.all([
        fetchNewsList({ status: "published", pageSize: HOME_GALLERY_PAGE_SIZE }),
        fetchVideosList({ status: "published", pageSize: HOME_GALLERY_PAGE_SIZE })
    ]);

    const newsImages = (newsResult.data || [])
        .filter((item) => String(item.coverImageUrl || "").trim())
        .map((item) => ({
            url: item.coverImageUrl,
            caption: item.title || tr("newsImage")
        }));

    const videoImages = (videoResult.data || [])
        .filter((item) => String(item.thumbnailUrl || "").trim())
        .map((item) => ({
            url: item.thumbnailUrl,
            caption: item.title || tr("videoThumbnail")
        }));

    const items = [...newsImages, ...videoImages].slice(0, HOME_GALLERY_MAX_ITEMS);

    if (!items.length) {
        container.innerHTML = `<p>${escapeHtml(tr("noGalleryYet"))}</p>`;
        return;
    }

    container.innerHTML = items.map((item) => `
<article class="gallery-card">
    <img class="gallery-photo" loading="lazy" decoding="async" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.caption)}">
    <p>${escapeHtml(item.caption)}</p>
</article>
`).join("");
}

function formatComments(comments) {
    if (!comments.length) {
        return `<p class="engagement-empty">${escapeHtml(tr("noCommentsYet"))}</p>`;
    }

    return comments.map((comment) => `
<div class="comment-item">
    <p class="comment-meta">${escapeHtml(comment.name || tr("anonymous"))} - ${new Date(comment.createdAt).toLocaleString()}</p>
    <p>${escapeHtml(comment.message)}</p>
</div>
`).join("");
}

function getAdminApiKey() {
    return localStorage.getItem("adminApiKey") || "";
}

function setAdminApiKey(value) {
    localStorage.setItem("adminApiKey", value);
}

function getAdminAuthToken() {
    return localStorage.getItem("adminAuthToken") || "";
}

function setAdminAuthToken(value) {
    localStorage.setItem("adminAuthToken", value);
}

function clearAdminAuthSession() {
    localStorage.removeItem("adminAuthToken");
    localStorage.removeItem("adminAuthUser");
}

function getAdminAuthUser() {
    const raw = localStorage.getItem("adminAuthUser");

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function setAdminAuthUser(user) {
    localStorage.setItem("adminAuthUser", JSON.stringify(user || null));
}

function buildAdminRequestHeaders(includeJsonContentType) {
    const headers = {};
    const token = getAdminAuthToken();
    const adminKey = getAdminApiKey();

    if (includeJsonContentType) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (adminKey) {
        headers["x-admin-key"] = adminKey;
    }

    return headers;
}

function ensureAdminCredentialAvailable() {
    const token = getAdminAuthToken();
    const adminKey = getAdminApiKey();

    if (!token && !adminKey) {
        throw new Error("Login required. Use Admin Login page or set legacy API key.");
    }
}

function enforceAdminAccessOnLoad(options = {}) {
    const { allowLegacyKey = false } = options;

    if (!isAdminPage()) {
        return true;
    }

    const path = String(window.location.pathname || "").toLowerCase();
    if (path.endsWith("login.html")) {
        return true;
    }

    const hasToken = Boolean(getAdminAuthToken());
    const hasLegacyKey = allowLegacyKey && Boolean(getAdminApiKey());

    if (!hasToken && !hasLegacyKey) {
        redirectToAdminLogin("Please sign in to access the admin area.");
        return false;
    }

    synchronizeAdminSession().then((user) => {
        if (!user && !hasLegacyKey) {
            clearAdminAuthSession();
            redirectToAdminLogin("Your admin session expired. Please sign in again.");
        }
    });

    return true;
}

function renderAdminAuthStatus() {
    const statusNode = document.getElementById("adminAuthStatus");

    if (!statusNode) {
        return;
    }

    const user = getAdminAuthUser();
    const token = getAdminAuthToken();
    const key = getAdminApiKey();

    if (token && user && user.email) {
        statusNode.innerHTML = `Auth: <strong>${escapeHtml(user.email)}</strong> (${escapeHtml(user.role || "user")})`;
        return;
    }

    if (key) {
        statusNode.innerHTML = "Auth: <strong>Legacy API key mode</strong>";
        return;
    }

    statusNode.innerHTML = "Auth: <strong>Not logged in</strong>";
}

function getAdminDisplayName(user) {
    return String(user?.name || user?.fullName || user?.email || "M62 WEB TV Team").trim();
}

function getAdminAvatarPhotoUrl(user) {
    return String(
        user?.photoUrl ||
        user?.avatarUrl ||
        user?.imageUrl ||
        user?.picture ||
        user?.profilePhoto ||
        ""
    ).trim();
}

function getAdminAvatarInitials(displayName) {
    const name = String(displayName || "").trim();

    if (!name) {
        return "MW";
    }

    const nameParts = name.split(/\s+/).filter(Boolean);
    if (nameParts.length >= 2) {
        return `${nameParts[0][0] || "M"}${nameParts[1][0] || "W"}`.toUpperCase();
    }

    const emailHandle = name.split("@")[0] || name;
    const letters = emailHandle.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();

    return letters || "MW";
}

function renderAdminDashboardProfile() {
    const avatarNode = document.getElementById("adminDashboardAvatar");
    const nameNode = document.getElementById("adminDashboardUserName");
    const roleNode = document.getElementById("adminDashboardUserRole");

    if (!avatarNode && !nameNode && !roleNode) {
        return;
    }

    const user = getAdminAuthUser();
    const displayName = getAdminDisplayName(user);
    const role = String(user?.role || "Admin").trim();
    const initials = getAdminAvatarInitials(displayName);
    const photoUrl = getAdminAvatarPhotoUrl(user);

    if (nameNode) {
        nameNode.textContent = displayName;
    }

    if (roleNode) {
        roleNode.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }

    if (!avatarNode) {
        return;
    }

    avatarNode.classList.remove("has-photo");
    avatarNode.textContent = initials;
    avatarNode.innerHTML = "";

    if (!photoUrl) {
        avatarNode.textContent = initials;
        return;
    }

    const image = document.createElement("img");
    image.alt = `${displayName} profile photo`;
    image.src = photoUrl;
    image.addEventListener("error", () => {
        avatarNode.classList.remove("has-photo");
        avatarNode.innerHTML = "";
        avatarNode.textContent = initials;
    });

    avatarNode.classList.add("has-photo");
    avatarNode.appendChild(image);
}

async function loginAdmin(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.success) {
        throw new Error(payload.message || "Login failed");
    }

    return payload.data || {};
}

async function requestAdminPasswordReset(email) {
    const response = await fetch(`${API_BASE_URL}/api/auth/password-reset/request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.success) {
        throw new Error(payload.message || "Unable to request password reset");
    }

    return payload;
}

async function confirmAdminPasswordReset(token, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/password-reset/confirm`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.success) {
        throw new Error(payload.message || "Unable to reset password");
    }

    return payload;
}

async function synchronizeAdminSession(options = {}) {
    const { allowCachedFallback = true } = options;
    const token = getAdminAuthToken();

    if (!token) {
        clearAdminAuthSession();
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: buildAdminRequestHeaders(false)
        });

        if (!response.ok) {
            clearAdminAuthSession();
            return null;
        }

        const payload = await response.json();
        const user = payload.data || null;
        setAdminAuthUser(user);
        return user;
    } catch (error) {
        if (!allowCachedFallback) {
            return null;
        }

        return getAdminAuthUser();
    }
}

async function fetchModerationComments(status, queryText, page, pageSize) {
    ensureAdminCredentialAvailable();

    const params = new URLSearchParams({
        status,
        q: queryText,
        page: String(page),
        pageSize: String(pageSize)
    });

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments?${params.toString()}`, {
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to load moderation comments");
    }

    const payload = await response.json();
    return {
        data: payload.data || [],
        meta: payload.meta || { page: 1, pageSize, totalItems: 0, totalPages: 1, hasPrev: false, hasNext: false }
    };
}

function buildModerationCommentKey(itemType, itemId, commentId) {
    return `${itemType}::${itemId}::${commentId}`;
}

function parseModerationCommentKey(key) {
    const [itemType, itemId, commentId] = String(key).split("::");
    return { itemType, itemId, commentId };
}

function getSelectedModerationItems() {
    return Array.from(moderationState.selected).map(parseModerationCommentKey);
}

function updateSelectionUiState(commentsInView) {
    const selectedCountNode = document.getElementById("selectedCommentsCount");
    const selectAll = document.getElementById("selectAllComments");
    const bulkApplyButton = document.getElementById("applyBulkAction");

    if (selectedCountNode) {
        selectedCountNode.textContent = `${moderationState.selected.size} selected`;
    }

    if (bulkApplyButton) {
        bulkApplyButton.disabled = moderationState.selected.size === 0;
    }

    if (selectAll) {
        if (!commentsInView.length) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
            return;
        }

        const keys = commentsInView.map((comment) => buildModerationCommentKey(comment.itemType, comment.itemId, comment.id));
        const selectedInView = keys.filter((key) => moderationState.selected.has(key)).length;
        selectAll.checked = selectedInView === keys.length;
        selectAll.indeterminate = selectedInView > 0 && selectedInView < keys.length;
    }
}

async function exportModerationCommentsCsv() {
    ensureAdminCredentialAvailable();

    const params = new URLSearchParams({
        status: moderationState.status,
        q: moderationState.query
    });

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments/export.csv?${params.toString()}`, {
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to export CSV");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const fileName = `comments_export_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

async function bulkModerateComments(action, items) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments/bulk`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify({ action, items })
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Bulk action failed");
    }

    return response.json();
}

async function moderateComment(itemType, itemId, commentId, action) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}/comments/${commentId}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify({ action })
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Moderation action failed");
    }
}

function renderModerationRows(comments) {
    if (!comments.length) {
        return `
<tr>
    <td colspan="9">No comments found for selected filter.</td>
</tr>
`;
    }

    return comments.map((comment) => `
<tr>
    <td><input type="checkbox" class="moderation-row-select" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}" ${moderationState.selected.has(buildModerationCommentKey(comment.itemType, comment.itemId, comment.id)) ? "checked" : ""}></td>
    <td>${escapeHtml(comment.itemType)}</td>
    <td>${escapeHtml(comment.itemId)}</td>
    <td>${escapeHtml(comment.name)}</td>
    <td>${escapeHtml(comment.message)}</td>
    <td>${new Date(comment.createdAt).toLocaleString()}</td>
    <td>${comment.archived ? "Archived" : (comment.hidden ? "Hidden" : "Visible")}</td>
    <td>
        <button type="button" data-action="hide" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Hide</button>
        <button type="button" data-action="unhide" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Unhide</button>
        <button type="button" data-action="archive" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Archive</button>
        <button type="button" data-action="unarchive" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Unarchive</button>
        <button type="button" data-action="delete" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Delete</button>
    </td>
</tr>
`).join("");
}

async function loadModerationComments() {
    const tableBody = document.getElementById("commentsModerationTable");
    const filter = document.getElementById("commentStatusFilter");
    const pageInfo = document.getElementById("moderationPageInfo");
    const prevButton = document.getElementById("moderationPrev");
    const nextButton = document.getElementById("moderationNext");

    moderationState.status = filter ? filter.value : moderationState.status;

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
<tr>
    <td colspan="9">Loading comments...</td>
</tr>
`;

    try {
        const result = await fetchModerationComments(
            moderationState.status,
            moderationState.query,
            moderationState.page,
            moderationState.pageSize
        );

        moderationState.page = result.meta.page;
        moderationState.totalPages = result.meta.totalPages;
        moderationState.selected.clear();
        tableBody.innerHTML = renderModerationRows(result.data);
        updateSelectionUiState(result.data);

        if (pageInfo) {
            pageInfo.textContent = `Page ${result.meta.page} of ${result.meta.totalPages} (${result.meta.totalItems} comments)`;
        }

        if (prevButton) {
            prevButton.disabled = !result.meta.hasPrev;
        }

        if (nextButton) {
            nextButton.disabled = !result.meta.hasNext;
        }
    } catch (error) {
        tableBody.innerHTML = `
<tr>
    <td colspan="9">${escapeHtml(error.message)}</td>
</tr>
`;
        moderationState.selected.clear();
        updateSelectionUiState([]);

        if (pageInfo) {
            pageInfo.textContent = "Unable to load comments";
        }

        if (prevButton) {
            prevButton.disabled = true;
        }

        if (nextButton) {
            nextButton.disabled = true;
        }
    }
}

function bindModerationActions() {
    const moderationTable = document.getElementById("commentsModerationTable");

    if (!moderationTable) {
        return;
    }

    moderationTable.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const action = button.getAttribute("data-action");
        const itemType = button.getAttribute("data-item-type");
        const itemId = button.getAttribute("data-item-id");
        const commentId = button.getAttribute("data-comment-id");

        try {
            await moderateComment(itemType, itemId, commentId, action);
            await loadModerationComments();
        } catch (error) {
            alert(error.message);
        }
    });

    moderationTable.addEventListener("change", (event) => {
        const checkbox = event.target.closest(".moderation-row-select");

        if (!checkbox) {
            return;
        }

        const key = buildModerationCommentKey(
            checkbox.getAttribute("data-item-type"),
            checkbox.getAttribute("data-item-id"),
            checkbox.getAttribute("data-comment-id")
        );

        if (checkbox.checked) {
            moderationState.selected.add(key);
        } else {
            moderationState.selected.delete(key);
        }

        const rowsInView = Array.from(document.querySelectorAll(".moderation-row-select")).map((input) => ({
            itemType: input.getAttribute("data-item-type"),
            itemId: input.getAttribute("data-item-id"),
            id: input.getAttribute("data-comment-id")
        }));

        updateSelectionUiState(rowsInView);
    });
}

function initializeModerationPage() {
    const apiKeyInput = document.getElementById("adminApiKey");
    const saveApiKeyButton = document.getElementById("saveAdminApiKey");
    const logoutButton = document.getElementById("logoutAdminSession");
    const refreshButton = document.getElementById("refreshComments");
    const clearFiltersButton = document.getElementById("clearCommentsFilters");
    const statusFilter = document.getElementById("commentStatusFilter");
    const searchInput = document.getElementById("commentSearch");
    const searchButton = document.getElementById("searchComments");
    const pageSizeSelect = document.getElementById("commentPageSize");
    const prevButton = document.getElementById("moderationPrev");
    const nextButton = document.getElementById("moderationNext");
    const exportButton = document.getElementById("exportCommentsCsv");
    const selectAllCheckbox = document.getElementById("selectAllComments");
    const bulkActionSelect = document.getElementById("bulkAction");
    const bulkApplyButton = document.getElementById("applyBulkAction");

    if (!apiKeyInput || !saveApiKeyButton || !refreshButton || !statusFilter) {
        return;
    }

    apiKeyInput.value = getAdminApiKey();
    synchronizeAdminSession().finally(() => {
        renderAdminAuthStatus();
    });

    saveApiKeyButton.addEventListener("click", () => {
        setAdminApiKey(apiKeyInput.value.trim());
        renderAdminAuthStatus();
        moderationState.page = 1;
        loadModerationComments();
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            clearAdminAuthSession();
            renderAdminAuthStatus();
            redirectToAdminLogin("You have been logged out.");
        });
    }

    refreshButton.addEventListener("click", loadModerationComments);

    const applyModerationSearch = () => {
        moderationState.query = searchInput ? searchInput.value.trim() : "";
        moderationState.page = 1;
        loadModerationComments();
    };

    const debouncedModerationSearch = createDebouncedFunction(applyModerationSearch, 300);

    statusFilter.addEventListener("change", () => {
        moderationState.page = 1;
        loadModerationComments();
    });

    if (searchInput && searchButton) {
        searchButton.addEventListener("click", () => {
            applyModerationSearch();
        });

        searchInput.addEventListener("input", () => {
            debouncedModerationSearch();
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                applyModerationSearch();
            }
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            moderationState.query = "";
            moderationState.status = "all";
            moderationState.page = 1;
            moderationState.pageSize = 25;

            if (searchInput) {
                searchInput.value = "";
            }

            if (statusFilter) {
                statusFilter.value = "all";
            }

            if (pageSizeSelect) {
                pageSizeSelect.value = "25";
            }

            loadModerationComments();
        });
    }

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener("change", () => {
            moderationState.pageSize = Number(pageSizeSelect.value || 25);
            moderationState.page = 1;
            loadModerationComments();
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            moderationState.page = Math.max(moderationState.page - 1, 1);
            loadModerationComments();
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            moderationState.page = Math.min(moderationState.page + 1, moderationState.totalPages);
            loadModerationComments();
        });
    }

    if (exportButton) {
        exportButton.addEventListener("click", async () => {
            try {
                await exportModerationCommentsCsv();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", () => {
            const rowCheckboxes = Array.from(document.querySelectorAll(".moderation-row-select"));

            rowCheckboxes.forEach((checkbox) => {
                const key = buildModerationCommentKey(
                    checkbox.getAttribute("data-item-type"),
                    checkbox.getAttribute("data-item-id"),
                    checkbox.getAttribute("data-comment-id")
                );

                checkbox.checked = selectAllCheckbox.checked;

                if (selectAllCheckbox.checked) {
                    moderationState.selected.add(key);
                } else {
                    moderationState.selected.delete(key);
                }
            });

            const rowsInView = rowCheckboxes.map((input) => ({
                itemType: input.getAttribute("data-item-type"),
                itemId: input.getAttribute("data-item-id"),
                id: input.getAttribute("data-comment-id")
            }));

            updateSelectionUiState(rowsInView);
        });
    }

    if (bulkApplyButton && bulkActionSelect) {
        bulkApplyButton.addEventListener("click", async () => {
            const action = bulkActionSelect.value;
            const items = getSelectedModerationItems();

            if (!action) {
                alert("Choose a bulk action first.");
                return;
            }

            if (!items.length) {
                alert("Select at least one comment.");
                return;
            }

            try {
                const result = await bulkModerateComments(action, items);
                alert(`Bulk action complete. Updated: ${result.data?.updated ?? 0}`);
                moderationState.selected.clear();
                await loadModerationComments();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    bindModerationActions();
    updateSelectionUiState([]);
    loadModerationComments();
}

function initializeAdminLoginPage() {
    const form = document.getElementById("adminLoginForm");
    const emailInput = document.getElementById("adminLoginEmail");
    const passwordInput = document.getElementById("adminLoginPassword");
    const submitButton = document.getElementById("adminLoginSubmit");
    const statusNode = document.getElementById("adminLoginStatus");
    const openResetRequestLink = document.getElementById("openPasswordResetRequest");
    const openResetConfirmLink = document.getElementById("openPasswordResetConfirm");
    const resetRequestForm = document.getElementById("adminPasswordResetRequestForm");
    const resetConfirmForm = document.getElementById("adminPasswordResetConfirmForm");
    const resetEmailInput = document.getElementById("adminResetEmail");
    const resetTokenInput = document.getElementById("adminResetToken");
    const resetNewPasswordInput = document.getElementById("adminResetNewPassword");
    const resetRequestSubmit = document.getElementById("adminResetRequestSubmit");
    const resetConfirmSubmit = document.getElementById("adminResetConfirmSubmit");
    const sessionActions = document.getElementById("adminLoginSessionActions");
    const openDashboardLink = document.getElementById("adminLoginOpenDashboard");
    const signOutLink = document.getElementById("adminLoginSignOut");
    const currentPath = String(window.location.pathname || "").toLowerCase();
    const dashboardPath = currentPath.includes("/admin/")
        ? currentPath.replace(/[^/]+$/, "dashboard.html")
        : "admin/dashboard.html";

    if (!form || !emailInput || !passwordInput || !submitButton || !statusNode) {
        return;
    }

    const hashTokenMatch = String(window.location.hash || "").match(/reset-token=([^&]+)/i);
    if (hashTokenMatch && resetTokenInput) {
        resetTokenInput.value = decodeURIComponent(hashTokenMatch[1]);
        if (resetConfirmForm) {
            resetConfirmForm.style.display = "block";
        }
    }

    const loginMessage = sessionStorage.getItem("m62AdminLoginMessage");
    if (loginMessage) {
        statusNode.textContent = loginMessage;
        statusNode.className = "status error";
        sessionStorage.removeItem("m62AdminLoginMessage");
    }

    synchronizeAdminSession({ allowCachedFallback: false }).then((existingUser) => {
        if (existingUser && existingUser.email) {
            statusNode.textContent = `Already logged in as ${existingUser.email}`;
            statusNode.className = "status success";
            submitButton.disabled = true;
            if (sessionActions) {
                sessionActions.style.display = "flex";
            }
            if (openDashboardLink) {
                openDashboardLink.focus?.();
            }
        }
    });

    if (signOutLink) {
        signOutLink.addEventListener("click", (event) => {
            event.preventDefault();
            clearAdminAuthSession();
            submitButton.disabled = false;
            statusNode.textContent = "Signed out. You can sign in again.";
            statusNode.className = "status";
            if (sessionActions) {
                sessionActions.style.display = "none";
            }
        });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = String(emailInput.value || "").trim().toLowerCase();
        const password = String(passwordInput.value || "");

        if (!email || !password) {
            statusNode.textContent = "Email and password are required.";
            statusNode.className = "status error";
            return;
        }

        submitButton.disabled = true;
        statusNode.textContent = "Signing in...";
        statusNode.className = "status";

        try {
            const data = await loginAdmin(email, password);
            setAdminAuthToken(String(data.token || ""));
            setAdminAuthUser(data.user || null);
            statusNode.textContent = "Login successful. Redirecting to dashboard...";
            statusNode.className = "status success";
            passwordInput.value = "";
            if (sessionActions) {
                sessionActions.style.display = "flex";
            }
            setTimeout(() => {
                window.location.href = dashboardPath;
            }, 500);
        } catch (error) {
            statusNode.textContent = error.message || "Login failed.";
            statusNode.className = "status error";
        } finally {
            submitButton.disabled = false;
        }
    });

    if (openResetRequestLink && resetRequestForm) {
        openResetRequestLink.addEventListener("click", (event) => {
            event.preventDefault();
            resetRequestForm.style.display = resetRequestForm.style.display === "none" ? "block" : "none";
        });
    }

    if (openResetConfirmLink && resetConfirmForm) {
        openResetConfirmLink.addEventListener("click", (event) => {
            event.preventDefault();
            resetConfirmForm.style.display = resetConfirmForm.style.display === "none" ? "block" : "none";
        });
    }

    if (resetRequestForm && resetEmailInput && resetRequestSubmit) {
        resetRequestForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = String(resetEmailInput.value || "").trim().toLowerCase();

            if (!email) {
                statusNode.textContent = "Enter your email for reset request.";
                statusNode.className = "status error";
                return;
            }

            resetRequestSubmit.disabled = true;
            statusNode.textContent = "Submitting reset request...";
            statusNode.className = "status";

            try {
                const payload = await requestAdminPasswordReset(email);
                const devToken = payload?.data?.token ? ` Token: ${payload.data.token}` : "";
                statusNode.textContent = `${payload.message || "Reset request submitted."}${devToken}`;
                statusNode.className = "status success";
            } catch (error) {
                statusNode.textContent = error.message || "Reset request failed.";
                statusNode.className = "status error";
            } finally {
                resetRequestSubmit.disabled = false;
            }
        });
    }

    if (resetConfirmForm && resetTokenInput && resetNewPasswordInput && resetConfirmSubmit) {
        resetConfirmForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const token = String(resetTokenInput.value || "").trim();
            const newPassword = String(resetNewPasswordInput.value || "");

            if (!token || !newPassword) {
                statusNode.textContent = "Token and new password are required.";
                statusNode.className = "status error";
                return;
            }

            resetConfirmSubmit.disabled = true;
            statusNode.textContent = "Resetting password...";
            statusNode.className = "status";

            try {
                const payload = await confirmAdminPasswordReset(token, newPassword);
                statusNode.textContent = payload.message || "Password reset successful.";
                statusNode.className = "status success";
                resetNewPasswordInput.value = "";
            } catch (error) {
                statusNode.textContent = error.message || "Password reset failed.";
                statusNode.className = "status error";
            } finally {
                resetConfirmSubmit.disabled = false;
            }
        });
    }
}

function initializeNewsManagementPage() {
    const refreshButton = document.getElementById("refreshNewsList");
    const newsTableBody = document.getElementById("adminNewsTableBody");
    const searchInput = document.getElementById("adminNewsSearch");
    const statusFilter = document.getElementById("adminNewsStatusFilter");
    const uploadButton = document.getElementById("uploadNewsImage");
    const fileInput = document.getElementById("newsImageFile");
    const imageUrlInput = document.getElementById("newsCoverImage");
    const uploadStatus = document.getElementById("newsImageUploadStatus");

    if (!newsTableBody) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const cancelEditButton = document.getElementById("cancelNewsEditButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadAdminNewsTable();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderAdminNewsTableFromState();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            renderAdminNewsTableFromState();
        });
    }

    if (uploadButton && fileInput && imageUrlInput && uploadStatus) {
        uploadButton.addEventListener("click", async () => {
            const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

            if (!file) {
                uploadStatus.textContent = "Choose an image before uploading.";
                return;
            }

            uploadButton.disabled = true;
            uploadStatus.textContent = "Uploading image...";

            try {
                const uploaded = await uploadNewsImageFile(file);
                imageUrlInput.value = String(uploaded.url || "");
                uploadStatus.textContent = "Upload successful. Cover image URL has been filled.";
            } catch (error) {
                uploadStatus.textContent = error.message || "Image upload failed.";
            } finally {
                uploadButton.disabled = false;
            }
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", () => {
            resetNewsEditor();
        });
    }

    newsTableBody.addEventListener("click", async (event) => {
        const editButton = event.target.closest("button[data-news-edit-id]");

        if (editButton) {
            beginNewsEdit(editButton.getAttribute("data-news-edit-id"));
            return;
        }

        const button = event.target.closest("button[data-news-delete-id]");

        if (!button) {
            return;
        }

        const newsId = button.getAttribute("data-news-delete-id");

        if (!newsId) {
            return;
        }

        const confirmed = window.confirm("Delete this news item?");
        if (!confirmed) {
            return;
        }

        try {
            await deleteNewsItem(newsId);
            await loadAdminNewsTable();
            await loadNews();
            alert("News item deleted.");
        } catch (error) {
            alert(error.message || "Delete failed");
        }
    });

    loadAdminNewsTable();
}

function initializeVideosManagementPage() {
    const refreshButton = document.getElementById("refreshVideosList");
    const tableBody = document.getElementById("videoTable");
    const searchInput = document.getElementById("adminVideoSearch");
    const statusFilter = document.getElementById("adminVideoStatusFilter");
    const uploadVideoButton = document.getElementById("uploadVideoFile");
    const videoFileInput = document.getElementById("videoFile");
    const videoUrlInput = document.getElementById("videoLink");
    const videoUploadStatus = document.getElementById("videoUploadStatus");
    const uploadThumbnailButton = document.getElementById("uploadVideoThumbnail");
    const thumbnailFileInput = document.getElementById("videoThumbnailFile");
    const thumbnailUrlInput = document.getElementById("videoThumbnailUrl");
    const thumbnailUploadStatus = document.getElementById("videoThumbnailUploadStatus");

    if (!tableBody) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const cancelEditButton = document.getElementById("cancelVideoEditButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadVideos();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderAdminVideosTableFromState();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            renderAdminVideosTableFromState();
        });
    }

    if (uploadVideoButton && videoFileInput && videoUrlInput && videoUploadStatus) {
        uploadVideoButton.addEventListener("click", async () => {
            const file = videoFileInput.files && videoFileInput.files[0] ? videoFileInput.files[0] : null;

            if (!file) {
                videoUploadStatus.textContent = "Choose a video file first.";
                return;
            }

            uploadVideoButton.disabled = true;
            videoUploadStatus.textContent = "Uploading video...";

            try {
                const uploaded = await uploadVideoFile(file);
                videoUrlInput.value = String(uploaded.url || "");
                videoUploadStatus.textContent = "Video uploaded successfully.";
            } catch (error) {
                videoUploadStatus.textContent = error.message || "Video upload failed.";
            } finally {
                uploadVideoButton.disabled = false;
            }
        });
    }

    if (uploadThumbnailButton && thumbnailFileInput && thumbnailUrlInput && thumbnailUploadStatus) {
        uploadThumbnailButton.addEventListener("click", async () => {
            const file = thumbnailFileInput.files && thumbnailFileInput.files[0] ? thumbnailFileInput.files[0] : null;

            if (!file) {
                thumbnailUploadStatus.textContent = "Choose a thumbnail image first.";
                return;
            }

            uploadThumbnailButton.disabled = true;
            thumbnailUploadStatus.textContent = "Uploading thumbnail...";

            try {
                const uploaded = await uploadNewsImageFile(file);
                thumbnailUrlInput.value = String(uploaded.url || "");
                thumbnailUploadStatus.textContent = "Thumbnail uploaded successfully.";
            } catch (error) {
                thumbnailUploadStatus.textContent = error.message || "Thumbnail upload failed.";
            } finally {
                uploadThumbnailButton.disabled = false;
            }
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", () => {
            resetVideoEditor();
        });
    }

    tableBody.addEventListener("click", async (event) => {
        const editButton = event.target.closest("button[data-video-edit-id]");

        if (editButton) {
            beginVideoEdit(editButton.getAttribute("data-video-edit-id"));
            return;
        }

        const button = event.target.closest("button[data-video-delete-id]");

        if (!button) {
            return;
        }

        const videoId = button.getAttribute("data-video-delete-id");
        if (!videoId) {
            return;
        }

        const confirmed = window.confirm("Delete this video item?");
        if (!confirmed) {
            return;
        }

        try {
            await deleteVideoItem(videoId);
            await loadVideos();
            await renderHomeVideos();
            alert("Video item deleted.");
        } catch (error) {
            alert(error.message || "Delete failed");
        }
    });

    loadVideos();
}

function initializeUsersManagementPage() {
    const tableBody = document.getElementById("usersTableBody");
    const refreshButton = document.getElementById("refreshUsersBtn");
    const clearFiltersButton = document.getElementById("clearUsersFiltersBtn");
    const searchInput = document.getElementById("usersSearch");
    const roleFilter = document.getElementById("usersRoleFilter");
    const statusFilter = document.getElementById("usersStatusFilter");
    const createButton = document.getElementById("createUserBtn");
    const newUserName = document.getElementById("newUserName");
    const newUserEmail = document.getElementById("newUserEmail");
    const newUserRole = document.getElementById("newUserRole");
    const newUserPassword = document.getElementById("newUserPassword");

    if (!tableBody) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const loadUsersTable = async () => {
        tableBody.innerHTML = "<tr><td colspan=\"6\">Loading users...</td></tr>";

        try {
            const users = await fetchUsersList({
                q: searchInput ? searchInput.value.trim() : "",
                role: roleFilter ? roleFilter.value : "",
                status: statusFilter ? statusFilter.value : "",
                pageSize: 100
            });
            tableBody.innerHTML = renderUsersRows(users);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan=\"6\">${escapeHtml(error.message || "Failed to load users")}</td></tr>`;
        }
    };

    const debouncedLoadUsersTable = createDebouncedFunction(() => {
        loadUsersTable();
    }, 300);

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadUsersTable();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            debouncedLoadUsersTable();
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                loadUsersTable();
            }
        });
    }

    if (roleFilter) {
        roleFilter.addEventListener("change", () => {
            loadUsersTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            loadUsersTable();
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
            }

            if (roleFilter) {
                roleFilter.value = "";
            }

            if (statusFilter) {
                statusFilter.value = "";
            }

            loadUsersTable();
        });
    }

    if (createButton && newUserName && newUserEmail && newUserRole && newUserPassword) {
        createButton.addEventListener("click", async () => {
            const payload = {
                name: String(newUserName.value || "").trim(),
                email: String(newUserEmail.value || "").trim().toLowerCase(),
                role: String(newUserRole.value || "editor").trim(),
                password: String(newUserPassword.value || "")
            };

            if (!payload.name || !payload.email || !payload.password) {
                alert("Name, email, and password are required.");
                return;
            }

            try {
                await createUserAccount(payload);
                alert("User created successfully.");
                newUserName.value = "";
                newUserEmail.value = "";
                newUserPassword.value = "";
                await loadUsersTable();
            } catch (error) {
                alert(error.message || "Failed to create user");
            }
        });
    }

    tableBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-user-action]");

        if (!button) {
            return;
        }

        const action = button.getAttribute("data-user-action");
        const userId = button.getAttribute("data-user-id");

        if (!action || !userId) {
            return;
        }

        try {
            if (action === "toggle-status") {
                const active = button.getAttribute("data-user-active") === "1";
                await updateUserAccount(userId, { isActive: !active });
                await loadUsersTable();
                return;
            }

            if (action === "promote-admin") {
                await updateUserAccount(userId, { role: "admin" });
                await loadUsersTable();
                return;
            }

            if (action === "set-editor") {
                await updateUserAccount(userId, { role: "editor" });
                await loadUsersTable();
                return;
            }

            if (action === "reset-password") {
                const newPassword = window.prompt("Enter new password (min 8 chars):", "");
                if (!newPassword) {
                    return;
                }
                await resetUserPassword(userId, newPassword);
                alert("Password reset successful.");
            }
        } catch (error) {
            alert(error.message || "User action failed");
        }
    });

    loadUsersTable();
}

function getDefaultPlatformSettings() {
    return {
        siteDisplayName: "M62 WEB TV NIGER",
        siteTagline: "The Voice of the People",
        defaultLanguage: "ha",
        homepageFeaturedCount: "4",
        newsDefaultStatus: "published",
        videoDefaultStatus: "published",
        watermarkText: "M62 WEB TV Official",
        requireStrongPasswords: "strict",
        sessionTimeoutMinutes: "60",
        securityNotice: "Use verified admin accounts only.",
        enableQuickModeration: true,
        enableAutoRefresh: false,
        showDraftWarnings: true,
        savedAt: ""
    };
}

function readPlatformSettings() {
    const defaults = getDefaultPlatformSettings();
    const stored = readStore("platformSettings", {});
    return {
        ...defaults,
        ...(stored && typeof stored === "object" ? stored : {})
    };
}

function writePlatformSettings(settings) {
    writeStore("platformSettings", settings);
}

function initializeSettingsPage() {
    const saveButton = document.getElementById("savePlatformSettings");
    const resetButton = document.getElementById("resetPlatformSettings");

    if (!saveButton || !resetButton) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const inputIds = [
        "siteDisplayName",
        "siteTagline",
        "defaultLanguage",
        "homepageFeaturedCount",
        "newsDefaultStatus",
        "videoDefaultStatus",
        "watermarkText",
        "requireStrongPasswords",
        "sessionTimeoutMinutes",
        "securityNotice"
    ];

    const checkboxIds = [
        "enableQuickModeration",
        "enableAutoRefresh",
        "showDraftWarnings"
    ];

    const feedback = document.getElementById("settingsFeedback");
    const savedAtBadge = document.getElementById("settingsSavedAt");
    const accessHint = document.getElementById("settingsAccessHint");
    let canManageSettings = true;

    const applySettingsToForm = (settings) => {
        inputIds.forEach((id) => {
            const node = document.getElementById(id);
            if (node) {
                node.value = String(settings[id] ?? "");
            }
        });

        checkboxIds.forEach((id) => {
            const node = document.getElementById(id);
            if (node) {
                node.checked = Boolean(settings[id]);
            }
        });

        if (savedAtBadge) {
            savedAtBadge.textContent = settings.savedAt
                ? `Saved: ${new Date(settings.savedAt).toLocaleString()}`
                : "Not saved yet";
        }
    };

    const collectFormSettings = () => {
        const next = readPlatformSettings();

        inputIds.forEach((id) => {
            const node = document.getElementById(id);
            if (node) {
                next[id] = String(node.value || "").trim();
            }
        });

        checkboxIds.forEach((id) => {
            const node = document.getElementById(id);
            if (node) {
                next[id] = Boolean(node.checked);
            }
        });

        next.savedAt = new Date().toISOString();
        return next;
    };

    const setSettingsEditability = (enabled) => {
        [...inputIds, ...checkboxIds].forEach((id) => {
            const node = document.getElementById(id);
            if (!node) {
                return;
            }

            if ("disabled" in node) {
                node.disabled = !enabled;
            }
        });

        saveButton.disabled = !enabled;
        resetButton.disabled = !enabled;
    };

    applySettingsToForm(readPlatformSettings());

    synchronizeAdminSession().then((user) => {
        const role = String(user?.role || "").toLowerCase();
        canManageSettings = role === "admin";
        setSettingsEditability(canManageSettings);

        if (accessHint) {
            if (canManageSettings) {
                accessHint.textContent = "Access level: Admin. You can edit and save platform settings.";
                accessHint.className = "admin-muted";
            } else {
                accessHint.textContent = "Access level: read-only. Only admin role can modify settings.";
                accessHint.className = "admin-lock-note";
            }
        }
    }).catch(() => {
        canManageSettings = false;
        setSettingsEditability(false);

        if (accessHint) {
            accessHint.textContent = "Unable to verify access. Settings are locked.";
            accessHint.className = "admin-lock-note";
        }
    });

    saveButton.addEventListener("click", () => {
        if (!canManageSettings) {
            if (feedback) {
                feedback.textContent = "Only admin users can save settings.";
            }
            return;
        }

        const nextSettings = collectFormSettings();
        writePlatformSettings(nextSettings);
        applySettingsToForm(nextSettings);

        if (feedback) {
            feedback.textContent = "Settings saved successfully.";
        }
    });

    resetButton.addEventListener("click", () => {
        if (!canManageSettings) {
            if (feedback) {
                feedback.textContent = "Only admin users can reset settings.";
            }
            return;
        }

        const defaults = getDefaultPlatformSettings();
        writePlatformSettings(defaults);
        applySettingsToForm(defaults);

        if (feedback) {
            feedback.textContent = "Settings reset to defaults.";
        }
    });
}

function initializeStatisticsPage() {
    const newsNode = document.getElementById("statNewsCount");
    const refreshButton = document.getElementById("refreshStatisticsBtn");

    if (!newsNode || !refreshButton) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const statNodes = {
        newsCount: document.getElementById("statNewsCount"),
        videosCount: document.getElementById("statVideosCount"),
        commentsCount: document.getElementById("statCommentsCount"),
        usersCount: document.getElementById("statUsersCount"),
        visitorsCount: document.getElementById("statVisitorsCount"),
        engagementCount: document.getElementById("statEngagementCount")
    };

    const summaryLine = document.getElementById("statsSummaryLine");
    const insightsList = document.getElementById("statsInsightsList");
    const generatedAt = document.getElementById("statsGeneratedAt");
    const apiStatus = document.getElementById("statsApiStatus");
    const mixBarsContainer = document.getElementById("statsMixBars");
    const latestContentBody = document.getElementById("statsTopContentBody");
    const trendChartNode = document.getElementById("statsTrendChart");
    const publishingProgress = document.getElementById("statProgressPublishing");
    const engagementProgress = document.getElementById("statProgressEngagement");
    const communityProgress = document.getElementById("statProgressCommunity");
    const publishingProgressText = document.getElementById("statProgressPublishingText");
    const engagementProgressText = document.getElementById("statProgressEngagementText");
    const communityProgressText = document.getElementById("statProgressCommunityText");
    const range7dButton = document.getElementById("statsRange7d");
    const range30dButton = document.getElementById("statsRange30d");
    const range90dButton = document.getElementById("statsRange90d");
    const exportCsvButton = document.getElementById("statsExportCsv");
    const exportPdfButton = document.getElementById("statsExportPdf");
    let selectedRangeDays = 30;
    let lastSnapshot = null;

    const setProgress = (barNode, textNode, percentValue) => {
        const percent = Math.max(0, Math.min(100, Number(percentValue || 0)));

        if (barNode) {
            barNode.style.width = `${percent}%`;
        }

        if (textNode) {
            textNode.textContent = `${percent}%`;
        }
    };

    const renderMixBars = (items) => {
        if (!mixBarsContainer) {
            return;
        }

        const maxValue = Math.max(1, ...items.map((item) => Number(item.value || 0)));
        mixBarsContainer.innerHTML = items.map((item) => {
            const percent = Math.max(0, Math.min(100, Math.round((Number(item.value || 0) / maxValue) * 100)));
            return `
<div class="admin-mix-row">
    <span class="admin-mix-label">${escapeHtml(item.label)}</span>
    <div class="admin-mix-track"><div class="admin-mix-fill" style="width:${percent}%"></div></div>
    <span class="admin-mix-value">${escapeHtml(String(item.value || 0))}</span>
</div>`;
        }).join("");
    };

    const renderLatestContentTable = (newsItems, videoItems) => {
        if (!latestContentBody) {
            return;
        }

        const mappedNews = (newsItems || []).map((item) => ({
            type: "News",
            title: item.title || "Untitled",
            category: item.category || "General",
            status: item.status || "published",
            publishedAt: item.publishedAt || item.createdAt || ""
        }));

        const mappedVideos = (videoItems || []).map((item) => ({
            type: "Video",
            title: item.title || "Untitled",
            category: item.category || "General",
            status: item.status || "published",
            publishedAt: item.publishedAt || item.createdAt || ""
        }));

        const items = [...mappedNews, ...mappedVideos]
            .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
            .slice(0, 8);

        if (!items.length) {
            latestContentBody.innerHTML = "<tr><td colspan=\"5\">No content activity yet.</td></tr>";
            return;
        }

        latestContentBody.innerHTML = items.map((item) => `
<tr>
    <td>${escapeHtml(item.type)}</td>
    <td>${escapeHtml(item.title)}</td>
    <td>${escapeHtml(item.category)}</td>
    <td>${escapeHtml(item.status)}</td>
    <td>${escapeHtml(formatNewsDate(item.publishedAt))}</td>
</tr>`).join("");
    };

    const buildSeries = (total, points) => {
        const base = Math.max(1, Number(total || 0));
        const result = [];

        for (let index = 0; index < points; index += 1) {
            const wave = Math.sin((index / Math.max(points - 1, 1)) * Math.PI * 1.7) * 0.2;
            const trend = index / Math.max(points - 1, 1);
            const value = Math.max(0, Math.round((base * (0.35 + trend * 0.75 + wave))));
            result.push(value);
        }

        return result;
    };

    const buildPolylinePoints = (series, width, height, maxValue) => {
        if (!series.length) {
            return "";
        }

        return series.map((value, index) => {
            const x = (index / Math.max(series.length - 1, 1)) * width;
            const normalized = Number(value || 0) / Math.max(maxValue, 1);
            const y = height - normalized * height;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(" ");
    };

    const renderTrendChart = (stats) => {
        if (!trendChartNode) {
            return;
        }

        const points = selectedRangeDays <= 7 ? 7 : (selectedRangeDays <= 30 ? 10 : 14);
        const newsSeries = buildSeries(stats.newsCount || 0, points);
        const videosSeries = buildSeries(stats.videosCount || 0, points);
        const maxValue = Math.max(1, ...newsSeries, ...videosSeries);
        const chartWidth = 100;
        const chartHeight = 100;
        const newsPoints = buildPolylinePoints(newsSeries, chartWidth, chartHeight, maxValue);
        const videoPoints = buildPolylinePoints(videosSeries, chartWidth, chartHeight, maxValue);

        trendChartNode.innerHTML = `
<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Content trend chart">
    <line x1="0" y1="100" x2="100" y2="100" stroke="#cfdced" stroke-width="0.7"></line>
    <line x1="0" y1="66" x2="100" y2="66" stroke="#e2eaf7" stroke-width="0.6"></line>
    <line x1="0" y1="33" x2="100" y2="33" stroke="#e2eaf7" stroke-width="0.6"></line>
    <polyline points="${newsPoints}" fill="none" stroke="#c0392b" stroke-width="1.8"></polyline>
    <polyline points="${videoPoints}" fill="none" stroke="#1f4e91" stroke-width="1.8"></polyline>
</svg>
<div class="admin-trend-legend">
    <span><span class="admin-trend-dot" style="background:#c0392b"></span>News trend</span>
    <span><span class="admin-trend-dot" style="background:#1f4e91"></span>Video trend</span>
    <span>Range: ${selectedRangeDays} days</span>
</div>`;
    };

    const setRangeButtonsState = () => {
        const buttons = [
            { node: range7dButton, days: 7 },
            { node: range30dButton, days: 30 },
            { node: range90dButton, days: 90 }
        ];

        buttons.forEach((entry) => {
            if (!entry.node) {
                return;
            }

            if (entry.days === selectedRangeDays) {
                entry.node.classList.add("is-active");
            } else {
                entry.node.classList.remove("is-active");
            }
        });
    };

    const exportStatisticsCsv = () => {
        if (!lastSnapshot) {
            return;
        }

        const rows = [
            ["RangeDays", selectedRangeDays],
            ["NewsCount", lastSnapshot.stats.newsCount || 0],
            ["VideosCount", lastSnapshot.stats.videosCount || 0],
            ["CommentsCount", lastSnapshot.stats.commentsCount || 0],
            ["UsersCount", lastSnapshot.stats.usersCount || 0],
            ["VisitorsCount", lastSnapshot.stats.visitorsCount || 0],
            ["EngagementCount", lastSnapshot.stats.engagementCount || 0],
            ["GeneratedAt", new Date().toISOString()],
            [],
            ["LatestContentType", "Title", "Category", "Status", "PublishedDate"]
        ];

        lastSnapshot.latestItems.forEach((item) => {
            rows.push([
                item.type,
                item.title,
                item.category,
                item.status,
                formatNewsDate(item.publishedAt)
            ]);
        });

        const csv = rows.map((row) => row.map((cell) => {
            const value = String(cell || "");
            return `"${value.replace(/"/g, '""')}"`;
        }).join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `m62_statistics_${selectedRangeDays}d_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const renderStatistics = async () => {
        const stats = await fetchDashboardStats();
        const [newsResult, videosResult] = await Promise.all([
            fetchNewsList({ status: "all", pageSize: 20 }),
            fetchVideosList({ status: "all", pageSize: 20 })
        ]);
        const newsItems = newsResult.data || [];
        const videoItems = videosResult.data || [];
        const latestItems = [...newsItems.map((item) => ({
            type: "News",
            title: item.title || "Untitled",
            category: item.category || "General",
            status: item.status || "published",
            publishedAt: item.publishedAt || item.createdAt || ""
        })), ...videoItems.map((item) => ({
            type: "Video",
            title: item.title || "Untitled",
            category: item.category || "General",
            status: item.status || "published",
            publishedAt: item.publishedAt || item.createdAt || ""
        }))].sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()).slice(0, 8);
        lastSnapshot = {
            stats,
            latestItems
        };

        Object.entries(statNodes).forEach(([key, node]) => {
            if (node) {
                node.textContent = String(stats[key] || 0);
            }
        });

        if (generatedAt) {
            generatedAt.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }

        const totalContent = Number(stats.newsCount || 0) + Number(stats.videosCount || 0);
        const engagementRate = totalContent > 0
            ? ((Number(stats.engagementCount || 0) / totalContent) * 100).toFixed(1)
            : "0.0";

        if (summaryLine) {
            summaryLine.textContent = `You have ${totalContent} content items with ~${engagementRate}% engagement per item and ${stats.visitorsCount || 0} visitors tracked.`;
        }

        if (insightsList) {
            const insights = [
                `${stats.newsCount || 0} news entries are currently visible in the pipeline.`,
                `${stats.videosCount || 0} videos are available for homepage and archive feeds.`,
                `${stats.commentsCount || 0} comments indicate community interaction depth.`,
                `${stats.usersCount || 0} team members currently have system access.`,
                `${newsItems.length + videoItems.length} recent content items were sampled for activity view.`
            ];

            insightsList.innerHTML = insights.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
        }

        renderMixBars([
            { label: "News", value: Number(stats.newsCount || 0) },
            { label: "Videos", value: Number(stats.videosCount || 0) },
            { label: "Comments", value: Number(stats.commentsCount || 0) },
            { label: "Visitors", value: Number(stats.visitorsCount || 0) },
            { label: "Engagement", value: Number(stats.engagementCount || 0) }
        ]);

        const publishingGoal = Math.round((Math.min(100, ((Number(stats.newsCount || 0) + Number(stats.videosCount || 0)) / 40) * 100)));
        const engagementGoal = Math.round((Math.min(100, ((Number(stats.engagementCount || 0)) / 200) * 100)));
        const communityGoal = Math.round((Math.min(100, ((Number(stats.commentsCount || 0)) / 120) * 100)));

        setProgress(publishingProgress, publishingProgressText, publishingGoal);
        setProgress(engagementProgress, engagementProgressText, engagementGoal);
        setProgress(communityProgress, communityProgressText, communityGoal);

        renderLatestContentTable(newsItems, videoItems);
        renderTrendChart(stats);
        setRangeButtonsState();

        if (apiStatus) {
            const apiLikelyOnline = Number(stats.usersCount || 0) > 0 || Number(stats.commentsCount || 0) > 0;
            apiStatus.textContent = apiLikelyOnline ? "API reachable" : "Fallback mode";
            apiStatus.className = `admin-status-pill ${apiLikelyOnline ? "success" : "warning"}`;
        }
    };

    refreshButton.addEventListener("click", () => {
        renderStatistics();
    });

    if (range7dButton) {
        range7dButton.addEventListener("click", () => {
            selectedRangeDays = 7;
            if (lastSnapshot) {
                renderTrendChart(lastSnapshot.stats);
                setRangeButtonsState();
            }
        });
    }

    if (range30dButton) {
        range30dButton.addEventListener("click", () => {
            selectedRangeDays = 30;
            if (lastSnapshot) {
                renderTrendChart(lastSnapshot.stats);
                setRangeButtonsState();
            }
        });
    }

    if (range90dButton) {
        range90dButton.addEventListener("click", () => {
            selectedRangeDays = 90;
            if (lastSnapshot) {
                renderTrendChart(lastSnapshot.stats);
                setRangeButtonsState();
            }
        });
    }

    if (exportCsvButton) {
        exportCsvButton.addEventListener("click", () => {
            exportStatisticsCsv();
        });
    }

    if (exportPdfButton) {
        exportPdfButton.addEventListener("click", () => {
            window.print();
        });
    }

    renderStatistics();
}

async function refreshEngagementWidgets() {
    const widgets = document.querySelectorAll(".engagement-widget");

    for (const widget of widgets) {
        const itemType = widget.getAttribute("data-item-type");
        const itemId = widget.getAttribute("data-item-id");
        const summaryNode = widget.querySelector(".engagement-summary");
        const commentsNode = widget.querySelector(".engagement-comments");

        const data = await getEngagement(itemType, itemId);
        summaryNode.innerText = `${tr("avgRating")}: ${data.summary.averageRating}/5 (${data.summary.ratingsCount} ${tr("ratings")}) • ${data.summary.commentsCount} ${tr("comments")}`;
        commentsNode.innerHTML = formatComments(data.comments.slice(0, 5));
    }
}

function bindEngagementForms() {
    document.addEventListener("submit", async (event) => {
        const form = event.target.closest(".engagement-form");

        if (!form) {
            return;
        }

        event.preventDefault();

        const itemType = form.getAttribute("data-item-type");
        const itemId = form.getAttribute("data-item-id");
        const formData = new FormData(form);
        const name = String(formData.get("name") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const ratingRaw = String(formData.get("rating") || "").trim();
        const submitButton = form.querySelector("button[type='submit']");

        if (submitButton) {
            submitButton.disabled = true;
        }

        setEngagementFeedback(form, "", "");

        if (!message && !ratingRaw) {
            alert("Add a comment or choose a rating before sending.");
            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }

        let usedFallback = false;

        try {
            if (message) {
                const result = await createComment(itemType, itemId, name, message);
                usedFallback = usedFallback || result.source === "fallback";
            }

            if (ratingRaw) {
                const result = await createRating(itemType, itemId, Number(ratingRaw));
                usedFallback = usedFallback || result.source === "fallback";
            }
        } catch (error) {
            if (error instanceof ApiError && error.status === 429 && error.retryAfterSeconds > 0) {
                setEngagementFeedback(form, `Too many requests. Please wait ${error.retryAfterSeconds} seconds.`, "warning");
            } else {
                setEngagementFeedback(form, error.message || "Unable to send your feedback right now.", "error");
            }

            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }

        form.reset();
        await refreshEngagementWidgets();

        if (usedFallback) {
            setEngagementFeedback(form, "Saved locally because backend is offline. Start backend to sync live data.", "warning");
        } else {
            setEngagementFeedback(form, "Thanks. Your feedback was submitted.", "success");
        }

        if (submitButton) {
            submitButton.disabled = false;
        }
    });
}

async function initializeHomePage() {
    ensureContentIds();
    await Promise.all([
        renderBreakingTicker(),
        renderFeaturedCarousel(),
        renderHomeNews(),
        renderFeaturedNews(),
        renderHomeVideos(),
        renderHomeGallery()
    ]);
    initializeFeaturedCarouselControls();
    initializeHomeSearch();

    if (!DATA_SAVER_ENABLED) {
        await refreshEngagementWidgets();
    }
}

function initializePublicContactForms() {
    const contactForm = document.getElementById("contactForm");
    const contactFeedback = document.getElementById("contactFormFeedback");
    const contactSubmitBtn = document.getElementById("contactSubmitBtn");

    if (contactForm) {
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = String(document.getElementById("contactName")?.value || "").trim();
            const email = String(document.getElementById("contactEmail")?.value || "").trim();
            const subject = String(document.getElementById("contactSubject")?.value || "").trim();
            const message = String(document.getElementById("contactMessage")?.value || "").trim();

            if (!name || !email || !subject || !message) {
                if (contactFeedback) {
                    contactFeedback.textContent = tr("feedbackFillAll");
                    contactFeedback.className = "form-feedback error";
                }
                return;
            }

            if (contactSubmitBtn) {
                contactSubmitBtn.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/contact`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload.message || tr("feedbackSendError"));
                }

                contactForm.reset();

                if (contactFeedback) {
                    contactFeedback.textContent = payload.message || tr("feedbackSent");
                    contactFeedback.className = "form-feedback";
                }
            } catch (error) {
                if (contactFeedback) {
                    contactFeedback.textContent = error.message || tr("feedbackSendFailed");
                    contactFeedback.className = "form-feedback error";
                }
            } finally {
                if (contactSubmitBtn) {
                    contactSubmitBtn.disabled = false;
                }
            }
        });
    }

    const newsletterForm = document.getElementById("newsletterForm");
    const newsletterInput = document.getElementById("newsletterEmail");
    const newsletterFeedback = document.getElementById("newsletterFeedback");

    if (newsletterForm && newsletterInput) {
        newsletterForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = String(newsletterInput.value || "").trim().toLowerCase();

            if (!email || !email.includes("@")) {
                if (newsletterFeedback) {
                    newsletterFeedback.textContent = tr("newsletterInvalid");
                    newsletterFeedback.className = "form-feedback error";
                }
                return;
            }

            const subscribers = readStore("newsletterSubscribers", []);
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                writeStore("newsletterSubscribers", subscribers);
            }

            newsletterForm.reset();
            if (newsletterFeedback) {
                newsletterFeedback.textContent = tr("newsletterSuccess");
                newsletterFeedback.className = "form-feedback";
            }
        });
    }
}

function initializeAdminRouteProtection() {
    enforceAdminAccessOnLoad({
        allowLegacyKey: String(window.location.pathname || "").toLowerCase().endsWith("comments.html")
    });
}

window.addEventListener("load", initializeAdminRouteProtection);
window.addEventListener("load", loadNews);
window.addEventListener("load", loadVideos);
window.addEventListener("load", loadLiveTV);
window.addEventListener("load", loadHomeLiveTV);
window.addEventListener("load", incrementVisitorCounterIfPublicPage);
window.addEventListener("load", updateDashboardStats);
window.addEventListener("load", initializeLanguageSelector);
window.addEventListener("load", initializeHomePage);
window.addEventListener("load", initializePublicContactForms);
window.addEventListener("load", initializeModerationPage);
window.addEventListener("load", initializeAdminLoginPage);
window.addEventListener("load", initializeNewsManagementPage);
window.addEventListener("load", initializeVideosManagementPage);
window.addEventListener("load", initializeUsersManagementPage);
window.addEventListener("load", initializeSettingsPage);
window.addEventListener("load", initializeStatisticsPage);

bindEngagementForms();