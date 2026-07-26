# Teste de dobramento de linhas iCal conforme RFC 5545 (medindo octetos UTF-8)

def fold_ical_line_octets(line):
    encoded = line.encode('utf-8')
    if len(encoded) <= 75:
        return line

    result = []
    current_bytes = 0
    current_line = []

    for char in line:
        char_bytes = len(char.encode('utf-8'))
        if current_bytes + char_bytes > 75:
            result.append("".join(current_line))
            current_line = [" "]  # espaço de continuação
            current_bytes = 1

        current_line.append(char)
        current_bytes += char_bytes

    if current_line:
        result.append("".join(current_line))

    crlf = chr(13) + chr(10)
    return crlf.join(result)

def run_tests():
    casos = [
        "SUMMARY:Horário de Atendimento e Orientação Especializada sobre Isenção PCD",
        "LOCATION:Rua Jacob Emmerich, 700 - Centro, São Vicente - SP",
        "DESCRIPTION:Atendimento técnico em Documentação Veicular\, Licenciamento e Recursos de Multa no Despachante 100 Milhas."
    ]

    for line in casos:
        folded = fold_ical_line_octets(line)
        crlf = chr(13) + chr(10)
        physical_lines = folded.split(crlf)
        print("[Linha Original] (" + str(len(line.encode('utf-8'))) + " bytes): " + line)
        for idx, pl in enumerate(physical_lines):
            pl_bytes = len(pl.encode('utf-8'))
            print("  -> Sublinha " + str(idx+1) + " (" + str(pl_bytes) + " bytes): " + pl)
            assert pl_bytes <= 75, "ERRO RFC 5545: Sublinha excede 75 octetos!"

    print("[OK] Todos os testes de octetos UTF-8 para RFC 5545 passaram com sucesso!")

if __name__ == "__main__":
    run_tests()
