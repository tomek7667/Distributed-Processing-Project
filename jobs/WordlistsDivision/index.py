def load_wordlist(path="./in/rockyou.txt"):
    with open(path, "rb") as f:
        wordlist = []
        for line in f:
            try:
                password = f.readline().decode().strip()
                if (password.isascii()):
                    wordlist.append(password)
            except:
                pass
    return wordlist


def divide_to_chunks(wordlist, n):
    output_chunks = []
    for i in range(0, len(wordlist), n):
        output_chunks.append("\n".join(wordlist[i:i + n]))
    return output_chunks


def main():
    wordlist_file = input("Enter the path to the wordlist file: ")
    if (wordlist_file == ""):
        wordlist_file = "rockyou.txt"
    wordlist_input_path = f"./in/{wordlist_file}"
    wordlist_output_path = f"./out/{wordlist_file}"
    wordlist = load_wordlist(wordlist_input_path)
    n = int(input("Enter the number of chunks: "))
    if (n == 0):
        n = 1
    chunks = divide_to_chunks(wordlist, n)
   
    for i in range(len(chunks)):
        with open(f"{wordlist_output_path.split('.txt')[0]}_{i}.txt", "w") as f:
            f.write(chunks[i])
            f.write("\n")


if __name__ == "__main__":
    main()
