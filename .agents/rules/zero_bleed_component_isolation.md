# Zero-Bleed Component Isolation Rule

All frontend development tasks across this workspace (React Native / Expo / Web) must strictly enforce the following 4 absolute boundaries:

---

## 1. The Sandbox Rule
- Any changes made to a component or screen file must have **0% impact** on the rest of the application.
- Never modify parent screens, global navigation, sibling components, or global configuration files unless explicitly commanded by the user.
- Only edit and output code for the exact file under active discussion.

---

## 2. Strictly Localized Styling
- All CSS, `StyleSheet.create` objects, and layout properties must be **100% scoped** to the exact file being modified.
- **Zero Global Overrides:** Never define global class names or mutate shared style constants that could bleed into neighboring components.
- **Defensive Layout:** Use `overflow: 'hidden'`, explicit margins/paddings, and flex wrapping. Never use rogue absolute positioning that breaks out of the component's parent container or causes layout shifts.

---

## 3. Pure Prop-Driven Logic (Black-Box Architecture)
- Treat components as sealed black boxes.
- Rely strictly on passed `props` for data and external actions (`onPress`, `onChange`, `onSubmit`).
- Do NOT implicitly import, read, or mutate global stores (Redux, Zustand, React Context) inside modular UI components unless specifically directed.
- Always provide defensive default values for optional props (`?`) so the component never crashes if a parent passes incomplete data.

---

## 4. Internal State Only
- All localized micro-interactions (accordion expand/collapse, active tabs, modal visibility, local loading spinners, toggles) must be handled using local state (`useState`, `useReducer`) strictly inside the component file.
- Never bleed local interaction state into parent screens or global stores.

---

## Objective
Every component or screen must function as an independent, plug-and-play widget that cannot break the layout or logic of neighboring screens or components.
