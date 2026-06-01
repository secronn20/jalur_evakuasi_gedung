"""
Steepest-Ascent Hill Climbing Algorithm
=========================================
Memeriksa SEMUA tetangga dan memilih yang TERBAIK (paling dekat ke goal).
Lebih teliti dari Simple HC tapi masih bisa terjebak di local optima.
"""

import math


def heuristic(pos, goal):
    """Manhattan distance sebagai fungsi heuristik."""
    return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])


def get_neighbors(pos, rows, cols):
    """Mendapatkan semua tetangga valid (8 arah untuk steepest)."""
    r, c = pos
    # 4-directional movement
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


def steepest_ascent_hill_climbing(grid, start, goal):
    """
    Steepest-Ascent Hill Climbing: evaluasi semua tetangga, pilih yang terbaik.
    
    Perbedaan dengan Simple HC:
    - Simple HC: ambil tetangga PERTAMA yang lebih baik (greedy)
    - Steepest HC: evaluasi SEMUA tetangga, ambil yang PALING baik (lebih optimal per langkah)
    
    Returns:
        dict dengan path, history, steps, kondisi tiap langkah
    """
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

        # Evaluasi semua tetangga
        neighbor_info = []
        best_h = float('inf')
        best_neighbor = None

        for n in neighbors:
            nr, nc = n
            cell_type = grid[nr][nc]
            passable = cell_type not in ["wall", "fire"]
            n_h = heuristic(n, goal) if passable else -1

            neighbor_info.append({
                "pos": list(n),
                "h": n_h,
                "passable": passable
            })

            # Steepest: cari yang TERBAIK dari semua tetangga
            if passable and n_h < current_h and n_h < best_h:
                best_h = n_h
                best_neighbor = n

        # Tandai tetangga terbaik
        for ni in neighbor_info:
            ni["is_best"] = (best_neighbor is not None and
                             ni["pos"] == list(best_neighbor))

        steps.append({
            "iteration": iteration,
            "current": list(current),
            "current_h": current_h,
            "neighbors": neighbor_info,
            "chosen": list(best_neighbor) if best_neighbor else None,
            "chosen_h": best_h if best_neighbor else None,
            "state_type": state_type,
            "evaluated_all": True,  # Flag pembeda dari Simple HC
            "description": _describe_step(current, best_neighbor,
                                          current_h, best_h, goal, state_type, iteration)
        })

        if current == goal:
            history.append(0)
            return {
                "success": True,
                "algorithm": "Steepest-Ascent Hill Climbing",
                "path": path,
                "history": history,
                "steps": steps,
                "local_optima": False,
                "termination": "goal_reached",
                "total_steps": iteration + 1
            }

        if best_neighbor is None:
            return {
                "success": False,
                "algorithm": "Steepest-Ascent Hill Climbing",
                "path": path,
                "history": history,
                "steps": steps,
                "local_optima": True,
                "termination": state_type,
                "total_steps": iteration + 1
            }

        current = best_neighbor
        visited.add(current)
        path.append(list(current))

    return {
        "success": False,
        "algorithm": "Steepest-Ascent Hill Climbing",
        "path": path,
        "history": history,
        "steps": steps,
        "local_optima": True,
        "termination": "max_iterations",
        "total_steps": max_iterations
    }


def _describe_step(current, chosen, current_h, chosen_h, goal, state_type, iteration):
    """Membuat deskripsi teks untuk setiap langkah Steepest-Ascent."""
    if state_type == "normal" and chosen:
        return (f"Langkah {iteration+1}: Dari {current} (h={current_h}) → "
                f"Semua tetangga dievaluasi. Terbaik: {chosen} (h={chosen_h}). "
                f"Pengurangan h: {current_h - chosen_h}.")
    elif state_type == "plateau":
        return (f"Langkah {iteration+1}: ⚠️ PLATEAU di {current} (h={current_h}). "
                f"Setelah evaluasi semua tetangga, tidak ada yang lebih baik (nilai sama).")
    elif state_type == "ridge":
        return (f"Langkah {iteration+1}: ⛰️ RIDGE di {current} (h={current_h}). "
                f"Jalur tersumbat, semua tetangga valid memiliki h lebih buruk.")
    elif state_type == "local_optima":
        return (f"Langkah {iteration+1}: 🚫 LOCAL OPTIMA di {current} (h={current_h}). "
                f"Setelah evaluasi semua tetangga, tidak ada yang lebih baik. Berhenti.")
    return f"Langkah {iteration+1}: Di {current} (h={current_h})."
