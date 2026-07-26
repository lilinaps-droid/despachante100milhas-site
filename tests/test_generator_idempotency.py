import os
import shutil
import hashlib
import subprocess

def get_dir_hashes(dir_path):
    hashes = {}
    for root, dirs, files in os.walk(dir_path):
        for f in sorted(files):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, dir_path)
            with open(full_path, 'rb') as fp:
                hashes[rel_path] = hashlib.sha256(fp.read()).hexdigest()
    return hashes

def test_idempotency():
    target_dir = "/tmp/public-100milhas-teste"
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    
    shutil.copytree("public", target_dir)
    print("[1] Cópias temporárias criadas em /tmp/public-100milhas-teste")

    hashes_initial = get_dir_hashes(target_dir)

    # Execução 1 do gerador
    res1 = subprocess.run(["python3", "gerar.py"], capture_output=True, text=True)
    hashes_run1 = get_dir_hashes(target_dir)
    print("[2] Execução 1 do gerador concluída.")

    # Execução 2 do gerador
    res2 = subprocess.run(["python3", "gerar.py"], capture_output=True, text=True)
    hashes_run2 = get_dir_hashes(target_dir)
    print("[3] Execução 2 do gerador concluída.")

    # Comparação entre execução 1 e execução 2 (idempotência perfeita)
    assert hashes_run1 == hashes_run2, "ERRO: Segunda execução produziu alterações adicionais!"
    print("[OK] Idempotência comprovada: Execução 2 produziu exatamente ZERO alterações adicionais em relação à Execução 1.")

if __name__ == "__main__":
    test_idempotency()
