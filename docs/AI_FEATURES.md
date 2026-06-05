# AI Features Documentation

## 1. Automated Resume Screening

**Endpoint:** `POST /api/applications/:jobId/upload`  
**Flow:** PDF/DOCX → text extraction → LLM JSON score (0–100) + matched/missing skills  
**Human intervention:** None required  

## 2. AI Job Matching

**Endpoint:** `GET /api/ai/job-recommendations`  
**Logic:** Compares employee profile + resume text against open jobs  

## 3. HR Chat & Voice

**Endpoint:** `POST /api/ai/chat`  
**Frontend:** Web Speech API (`SpeechRecognition`) for voice-to-text  
**Fallback:** Rule-based responses when OpenAI key absent  

## 4. Attendance Anomaly AI

**Endpoint:** `GET /api/hr/attendance/insights`  
**Detects:** Late patterns, absences, missing check-outs, overtime risk  

## 5. Performance AI Insights

**Endpoint:** `POST /api/hr/performance`  
**Output:** `aiSummary` + `aiRecommendations` on each review  
