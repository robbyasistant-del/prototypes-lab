# Word-Solitaire Mix v2

## Mecánica implementada
- Mano de 7 letras por ronda.
- 1 descarte tipo póker por ronda.
- Construcción de 3 palabras de 5 letras usando solo esas 7 letras.
- Score base estilo Scrabble simplificado por tipo de letra.
- Multiplicador por reutilización de letra:
  - usada en 2 palabras => x1.5
  - usada en 3 palabras => x2.0

## Run
Abrir `index.html`.

## Qué probar
1. Descarte único funciona (solo 1 vez).
2. No permite palabras fuera de la mano.
3. Calcula score base + bonus por reutilización.
4. Suma total por rondas.
5. Guarda best/streak en localStorage.
