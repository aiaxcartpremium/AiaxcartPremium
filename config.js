// ==== CONFIG (edit this) ====
window.APP = {
  url: "https://qddjhayaqkdcxqgdriav.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZGpoYXlhcWtkY3hxZ2RyaWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODEzMzUsImV4cCI6MjA3Nzg1NzMzNX0.Z_w3O9z6ZdZKt1TS3p4e6YYeUl1XHlCohLAatbA7g2U",

  ownerId: "8cd15b4b-0755-4843-a8d5-2652fa408fe5",
  admins: [
    "4e63c32b-cc75-48de-b111-e8a977d868a2",
    "20851a7b-ef92-41a1-80d1-d2a6081396d5"
  ],

  // Flat list with category (and parent for nested Vivamax items)
  PRODUCTS: [
    // entertainment
    { key:"netflix", label:"Netflix", category:"entertainment" },
    { key:"viu", label:"Viu", category:"entertainment" },
    { key:"vivamax", label:"Vivamax", category:"entertainment" },
    { key:"vivaone", label:"VivaOne", category:"entertainment" },
    { key:"disney-plus", label:"Disney+", category:"entertainment" },
    { key:"bilibili", label:"Bilibili", category:"entertainment" },
    { key:"iqiyi", label:"iQIYI", category:"entertainment" },
    { key:"wetv", label:"WeTV", category:"entertainment" },
    { key:"loklok", label:"Loklok", category:"entertainment" },
    { key:"iwanttfc", label:"iWantTFC", category:"entertainment" },
    { key:"amazon-prime", label:"Amazon Prime", category:"entertainment" },
    { key:"crunchyroll", label:"Crunchyroll", category:"entertainment" },
    { key:"hbo-max", label:"HBO Max", category:"entertainment" },
    { key:"youku", label:"Youku", category:"entertainment" },
    { key:"nba-league-pass", label:"NBA League Pass", category:"entertainment" },

    // streaming
    { key:"spotify", label:"Spotify", category:"streaming" },
    { key:"youtube", label:"YouTube", category:"streaming" },
    { key:"apple-music", label:"Apple Music", category:"streaming" },

    // educational
    { key:"studocu", label:"Studocu", category:"educational" },
    { key:"scribd", label:"Scribd", category:"educational" },
    { key:"grammarly", label:"Grammarly", category:"educational" },
    { key:"quillbot", label:"QuillBot", category:"educational" },
    { key:"ms365", label:"MS365", category:"educational" },
    { key:"quizlet-plus", label:"Quizlet+", category:"educational" },
    { key:"camscanner", label:"CamScanner", category:"educational" },
    { key:"smallpdf", label:"Smallpdf", category:"educational" },
    { key:"turnitin-student", label:"Turnitin Student", category:"educational" },
    { key:"turnitin-instructor", label:"Turnitin Instructor", category:"educational" },
    { key:"duolingo-super", label:"Duolingo Super", category:"educational" },

    // editing
    { key:"canva", label:"Canva", category:"editing" },
    { key:"picsart", label:"Picsart", category:"editing" },
    { key:"capcut", label:"CapCut", category:"editing" },
    { key:"remini-web", label:"Remini Web", category:"editing" },
    { key:"alight-motion", label:"Alight Motion", category:"editing" },

    // ai
    { key:"chatgpt", label:"ChatGPT", category:"ai" },
    { key:"gemini-ai", label:"Gemini AI", category:"ai" },
    { key:"blackbox-ai", label:"Blackbox AI", category:"ai" },
    { key:"perplexity", label:"Perplexity", category:"ai" },
],

  // keep these in the same format your app expects
  ACCOUNT_TYPES: ["shared profile", "solo profile", "shared account", "solo account"],
  DURATIONS: [
    ["7 days","7d"],["14 days","14d"],
    ["1 month","1m"],["2 months","2m"],["3 months","3m"],
    ["4 months","4m"],["5 months","5m"],["6 months","6m"],
    ["7 months","7m"],["8 months","8m"],["9 months","9m"],
    ["10 months","10m"],["11 months","11m"],["12 months","12m"]
  ]
};