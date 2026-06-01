"""
Stochastic Hill Climbing Algorithm
=====================================
Memilih tetangga secara ACAK dari tetangga yang lebih baik,
bukan selalu yang terbaik. Memberi probabilitas escape dari local optima.
"""

import random
import math


def heuristic(pos, goal):
    """Manhattan distance sebagai fungsi heuristik."""
    return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])


def get_neighbors(pos, rows, cols):
    """Mendapatkan semua tetangga valid."""
    r, c = pos
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    neighbors = []
    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            neighbors.append((nr, nc))
    return neighbors


def classify_state(current, neighbors, goal, grid):
    """Mengidentifikasi kondisi: normal, local_optima, plateau, ridge."""
    current_h = heuristic(current, goal)
    rows, cols = len(grid), len(grid[0])

    valid_neighbors = [n for n in neighbors
                       if grid[n[0]][n[1]] not in ["wall", "fire"]]

    if not valid_neighbors:
        return "local_optima"

    h_values = [heuristic(n, goal) for n in valid_neighbors]
    min_h = min(h_values)

    if min_h < current_h:
        return "normal"
    elif min_h == current_h:
        return "plateau"
    else:
        blocked = sum(1 for n in get_neighbors(current, rows, cols)
                      if grid[n[0]][n[1]] in ["wall", "fire"])
        if blocked >= 2:
            return "ridge"
        return "local_optima"


def compute_probability(current_h, neighbor_h, temperature=5.0):
    """
    Menghitung probabilitas pemilihan tetangga berdasarkan perbedaan heuristik.
    Tetangga dengan h lebih rendah punya probabilitas lebih tinggi.
    """
    delta = current_h - neighbor_h  # Positif = lebih baik
    if delta <= 0:
        return 0.0
    # Softmax-style probability
    return math.exp(delta / temperature)


def stochastic_hill_climbing(grid, start, goal, seed=None):
    """
    Stochastic Hill Climbing: pilih SECARA ACAK dari semua tetangga yang lebih baik.
    
    Perbedaan dengan Simple/Steepest HC:
    - Tidak selalu ambil yang terbaik → ada variasi eksplorasi
    - Probabilitas pemilihan proporsional terhadap perbaikan heuristik
    - Lebih tahan terhadap kondisi lokal (lebih banyak eksplorasi)
    
    Returns:
        dict dengan path, history, steps, probabilitas, kondisi
    """
    if seed is not None:
        random.seed(seed)

    rows = len(grid)
    cols = len(grid[0])

    current = start
    path = [list(current)]
    history = []
    steps = []
    visited = set()
    visited.add(current)

    max_iterations = rows * cols * 2

    for iteration in range(max_iterations):
        current_h = heuristic(current, goal)
        history.append(current_h)

        neighbors = get_neighbors(current, rows, cols)
        state_type = classify_state(current, neighbors, goal, grid)

        # Kumpulkan semua tetangga yang lebih baik beserta probabilitasnya
        better_neighbors = []
        neighbor_info = []

        for n in neighbors:
            nr, nc = n
            cell_type = grid[nr][nc]
            passable = cell_type not in ["wall", "fire"]
            n_h = heuristic(n, goal) if passable else -1
            prob = compute_probability(current_h, n_h) if (passable and n_h >= 0) else 0.0

            neighbor_info.append({
                "pos": list(n),
                "h": n_h,
                "passable": passable,
                "probability": round(prob, 4),
                "is_better": passable and n_h < current_h
            })

            if passable and n_h < current_h:
                better_neighbors.append((n, prob))

        # Pilih secara stokastik berdasarkan probabilitas
        chosen = None
        chosen_prob = 0.0
        if better_neighbors:
            neighbors_list = [n for n, _ in better_neighbors]
            weights = [p for _, p in better_neighbors]
            total_weight = sum(weights)

            if total_weight > 0:
                # Weighted random selection
                r_val = random.uniform(0, total_weight)
                cumulative = 0
                for n, w in better_neighbors:
                    cumulative += w
                    if r_val <= cumulative:
                        chosen = n
                        chosen_prob = w / total_weight
                        break
                if chosen is None:
                    chosen = better_neighbors[-1][0]
                    chosen_prob = better_neighbors[-1][1] / total_weight
            else:
                chosen = random.choice(neighbors_list)

        # Tandai yang terpilih
        for ni in neighbor_info:
            ni["is_chosen"] = (chosen is not None and ni["pos"] == list(chosen))

        steps.append({
            "iteration": iteration,
            "current": list(current),
            "current_h": current_h,
            "neighbors": neighbor_info,
            "chosen": list(chosen) if chosen else None,
            "chosen_h": heuristic(chosen, goal) if chosen else None,
            "chosen_probability": round(chosen_prob * 100, 2),
            "better_count": len(better_neighbors),
            "state_type": state_type,
            "is_stochastic": True,
            "description": _describe_step(current, chosen, current_h, goal,
                                           state_type, iteration, len(better_neighbors),
                                           chosen_prob)
        })

        if current == goal:
            history.append(0)
            return {
                "success": True,
                "algorithm": "Stochastic Hill Climbing",
                "path": path,
                "history": history,
                "steps": steps,
                "local_optima": False,
                "termination": "goal_reached",
                "total_steps": iteration + 1
            }

        if chosen is None:
            return {
                "success": False,
                "algorithm": "Stochastic Hill Climbing",
                "path": path,
                "history": history,
                "steps": steps,
                "local_optima": True,
                "termination": state_type,
                "total_steps": iteration + 1
            }

        current = chosen
        visited.add(current)
        path.append(list(current))

    return {
        "success": False,
        "algorithm": "Stochastic Hill Climbing",
        "path": path,
        "history": history,
        "steps": steps,
        "local_optima": True,
        "termination": "max_iterations",
        "total_steps": max_iterations
    }


def _describe_step(current, chosen, current_h, goal, state_type, iteration,
                   better_count, chosen_prob):
    """Membuat deskripsi teks untuk setiap langkah Stochastic HC."""
    if state_type == "normal" and chosen:
        chosen_h = heuristic(tuple(chosen), goal)
        return (f"Langkah {iteration+1}: Dari {current} (h={current_h}). "
                f"{better_count} tetangga lebih baik tersedia. "
                f"🎲 Dipilih secara stokastik: {chosen} (h={chosen_h}, "
                f"prob={chosen_prob*100:.1f}%).")
    elif state_type == "plateau":
        return (f"Langkah {iteration+1}: ⚠️ PLATEAU di {current} (h={current_h}). "
                f"Tidak ada tetangga lebih baik untuk dipilih secara stokastik.")
    elif state_type == "ridge":
        return (f"Langkah {iteration+1}: ⛰️ RIDGE di {current} (h={current_h}). "
                f"Jalur tersumbat, pilihan stokastik tidak tersedia.")
    elif state_type == "local_optima":
        return (f"Langkah {iteration+1}: 🚫 LOCAL OPTIMA di {current} (h={current_h}). "
                f"Tidak ada tetangga yang lebih baik. Algoritma berhenti.")
    return f"Langkah {iteration+1}: Di {current} (h={current_h})."
