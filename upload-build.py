"""
upload-build.py
Sobe a pasta .next buildada para o servidor Hostinger via SFTP.
Uso: python upload-build.py
"""

import paramiko
import os
import sys

HOST = '147.93.14.101'
PORT = 65002
USER = 'u697575747'
PASSWORD = '315426798Ygor!'

LOCAL_NEXT = os.path.join(os.path.dirname(__file__), 'frontend', '.next')
REMOTE_NEXT = '/home/u697575747/domains/ygorstefan.com/portfolio/public/ecommerce/frontend/.next'

def upload_dir(sftp, local_path, remote_path):
    """Sobe um diretório recursivamente via SFTP."""
    try:
        sftp.mkdir(remote_path)
    except OSError:
        pass

    items = os.listdir(local_path)
    total = len(items)

    for i, item in enumerate(items, 1):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"

        if os.path.isdir(local_item):
            # Pula pastas de cache que não são necessárias em produção
            if item in ['cache']:
                continue
            upload_dir(sftp, local_item, remote_item)
        else:
            sftp.put(local_item, remote_item)

        # Progress simples
        if i % 20 == 0 or i == total:
            print(f"  {remote_path.split('/')[-1]}: {i}/{total} arquivos")

def main():
    if not os.path.exists(LOCAL_NEXT):
        print("ERRO: Pasta .next nao encontrada.")
        print("Execute primeiro: cd frontend && npm run build")
        sys.exit(1)

    print(f"Conectando ao servidor {HOST}:{PORT}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD)

    print("Conectado! Iniciando upload da pasta .next...")
    sftp = client.open_sftp()

    # Limpar .next remoto antes de subir
    print("Limpando .next remoto anterior...")
    stdin, stdout, stderr = client.exec_command(f'rm -rf {REMOTE_NEXT} && mkdir -p {REMOTE_NEXT}')
    stdout.read()

    print(f"Subindo {LOCAL_NEXT} para {REMOTE_NEXT}")
    upload_dir(sftp, LOCAL_NEXT, REMOTE_NEXT)

    sftp.close()
    client.close()

    print("\nUpload concluido!")
    print("Agora configure os apps Node.js no hPanel da Hostinger.")

if __name__ == '__main__':
    main()
