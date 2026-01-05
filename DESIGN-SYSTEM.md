# 🎨 Design System - Sleep Apnea Management

## Paletă de Culori (Medical Theme)

### Culorile Principale
Tema aplicației folosește tonuri **reci și profesionale** (cyan/slate) pentru a transmite încredere medicală, cu accent pe **accesibilitate WCAG AA**.

### Token-uri de Design

#### 1. Backgrounds (Fundal)
```css
--bg-primary: #f5f7fa        /* Fundal principal aplicație */
--bg-elevated: #ffffff        /* Card-uri, modale, suprafețe ridicate */
--bg-surface: #f8fafc         /* Suprafețe secundare, card-uri imbricate */
--bg-surface-light: #e2e8f0   /* Hover states, câmpuri dezactivate */
--bg-accent: #ebf4ff          /* Fundal accent subtil */
```

**Tailwind classes:**
- `bg-bg-primary` - fundal principal
- `bg-bg-elevated` - card-uri, modale
- `bg-bg-surface` - suprafețe secundare
- `bg-bg-surface-light` - hover, disabled
- `bg-bg-accent` - accent subtil

#### 2. Text (Culori Text)
```css
--text-primary: #1e293b       /* Text principal - contrast 16.5:1 */
--text-secondary: #475569     /* Text secundar - contrast 8:1 */
--text-tertiary: #64748b      /* Text terțiar - hint-uri - contrast 4.5:1 */
--text-inverse: #ffffff       /* Text pe fundal întunecat */
--text-link: #2563eb          /* Link-uri interactive */
```

**Tailwind classes:**
- `text-text-primary` - text principal
- `text-text-secondary` - labels, descrieri
- `text-text-tertiary` - timestamp-uri, hint-uri
- `text-text-inverse` - text pe fundal închis
- `text-text-link` - link-uri

#### 3. Interactive (Culori Interacțiuni)
```css
--interactive-primary: #0891b2       /* Acțiuni principale (cyan-600) */
--interactive-primary-hover: #0e7490  /* Hover state (cyan-700) */
--interactive-primary-active: #155e75 /* Active/pressed (cyan-800) */
--interactive-primary-light: #cffafe  /* Fundal deschis (cyan-50) */
```

**Tailwind classes:**
- `bg-primary` sau `text-primary` - culoare principală
- `bg-primary-hover` - hover state
- `bg-primary-active` - active/pressed
- `bg-primary-light` - fundal deschis

#### 4. Borders (Margini)
```css
--border-light: #cbd5e1       /* Margini standard */
--border-medium: #94a3b8      /* Margini accentuate */
--border-focus: #3b82f6       /* Focus ring pentru accesibilitate */
--border-error: #dc2626       /* Margini stare eroare */
```

**Tailwind classes:**
- `border-border-light` - margini standard
- `border-border-focus` - focus ring
- `border-border-error` - erori

#### 5. Functional Colors (Culori Funcționale)

##### Error/Danger (Roșu)
```css
--alert-error-bg: #fef2f2       /* Fundal eroare */
--alert-error-text: #991b1b     /* Text eroare */
--alert-error-border: #dc2626   /* Accent eroare */
```

**Tailwind:** `bg-error-bg`, `text-error-text`, `border-error-border`

##### Warning/Caution (Galben/Portocaliu)
```css
--alert-warning-bg: #fffbeb     /* Fundal atenționare */
--alert-warning-text: #92400e   /* Text atenționare */
--alert-warning-border: #f59e0b /* Accent atenționare */
```

**Tailwind:** `bg-warning-bg`, `text-warning-text`, `border-warning-border`

##### Success (Verde)
```css
--alert-success-bg: #f0fdf4     /* Fundal succes */
--alert-success-text: #166534   /* Text succes */
--alert-success-border: #16a34a /* Accent succes */
```

**Tailwind:** `bg-success-bg`, `text-success-text`, `border-success-border`

##### Info (Albastru)
```css
--alert-info-bg: #eff6ff        /* Fundal informativ */
--alert-info-text: #1e40af      /* Text informativ */
--alert-info-border: #3b82f6    /* Accent informativ */
```

**Tailwind:** `bg-info-bg`, `text-info-text`, `border-info-border`

---

## 🔍 Accesibilitate (WCAG AA Compliance)

### Contrast Minim
- **Text normal (16px+):** Minim 4.5:1
- **Text mare (18px+ sau bold 14px+):** Minim 3:1
- **Text principal:** 16.5:1 ✅
- **Text secundar:** 8:1 ✅
- **Text terțiar:** 4.5:1 ✅

### Focus States
Toate elementele interactive TREBUIE să aibă focus visible:
```jsx
className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

### Skip Links
Pentru utilizatori cu screen reader:
```jsx
<a href="#main-content" className="skip-link">Skip to main content</a>
```

---

## 📏 Spacing (Distanțe)
Bazat pe grid de 8px:
```css
--space-xs: 0.25rem   /* 4px */
--space-sm: 0.5rem    /* 8px */
--space-md: 1rem      /* 16px */
--space-lg: 1.5rem    /* 24px */
--space-xl: 2rem      /* 32px */
--space-2xl: 3rem     /* 48px */
```

---

## 🔤 Tipografie
```css
--font-size-xs: 0.75rem    /* 12px */
--font-size-sm: 0.875rem   /* 14px */
--font-size-base: 1rem     /* 16px */
--font-size-lg: 1.125rem   /* 18px */
--font-size-xl: 1.25rem    /* 20px */
--font-size-2xl: 1.5rem    /* 24px */
--font-size-3xl: 1.875rem  /* 30px */
```

---

## 🎯 Exemple de Utilizare

### Card Standard
```jsx
<div className="bg-bg-elevated rounded-lg shadow-md border border-border-light p-6">
  <h2 className="text-text-primary font-semibold mb-2">Titlu Card</h2>
  <p className="text-text-secondary">Descriere card</p>
</div>
```

### Buton Principal
```jsx
<button className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-inverse rounded-lg font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
  Acțiune Principală
</button>
```

### Alert de Eroare
```jsx
<div className="bg-error-bg border-l-4 border-error-border text-error-text p-4 rounded-lg">
  <p className="font-semibold">Eroare</p>
  <p className="text-sm">Mesaj de eroare</p>
</div>
```

### Input cu Focus
```jsx
<input 
  type="text"
  className="w-full px-3 py-2 border border-border-light rounded-lg bg-bg-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
  placeholder="Introduceți text..."
/>
```

---

## 🔄 Migrare de la Tema Veche

### Mappingul Culorilor
| Culoare Veche (Teal) | Culoare Nouă (Cyan) | Utilizare |
|---------------------|---------------------|-----------|
| `#14b8a6` (teal-500) | `primary` (cyan-600) | Acțiuni principale |
| `#0d9488` (teal-600) | `primary-hover` | Hover state |
| `#065f46` (teal-900) | `text-primary` (slate) | Text principal |
| `#f0fdfa` (teal-50) | `bg-surface` | Suprafețe |
| `#ccfbf1` (teal-100) | `primary-light` | Fundal accent |

### Script Automat
Rulați `node update-colors.js` pentru conversie automată.

---

## 📱 Responsive Design
Toate componentele folosesc clase Tailwind responsive:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

---

## ✅ Checklist Accesibilitate

- [ ] Toate butoanele au focus visible
- [ ] Contrast text minim 4.5:1
- [ ] Input-urile au labels asociate
- [ ] Culori funcționale (roșu, galben, verde) + text descriptiv
- [ ] Navigare cu tastatură funcțională
- [ ] Skip links pentru screen readers
- [ ] Stări de eroare clare și vizibile

---

**Versiune:** 1.0  
**Data:** Ianuarie 2026  
**Bazat pe:** WCAG 2.1 Level AA
