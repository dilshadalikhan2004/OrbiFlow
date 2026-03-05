import subprocess
import sys

def run_tests():
    try:
        print("Starting tests...")
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/test_api.py"],
            capture_output=True,
            text=True
        )
        with open("test_execution_log.txt", "w") as f:
            f.write("STDOUT:\n")
            f.write(result.stdout)
            f.write("\nSTDERR:\n")
            f.write(result.stderr)
        print("Tests finished. Log written to test_execution_log.txt")
    except Exception as e:
        with open("test_execution_log.txt", "w") as f:
            f.write(f"Error running tests: {str(e)}")

if __name__ == "__main__":
    run_tests()
