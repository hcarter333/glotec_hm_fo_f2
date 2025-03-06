import subprocess
import time
import requests
import sys
import os

def run_command(cmd, shell=False):
    """Run a command and exit on error."""
    result = subprocess.run(cmd, shell=shell, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {' '.join(cmd)}")
        print(result.stderr)
        sys.exit(result.returncode)
    return result.stdout.strip()

# Step 1: Create a glotec database with the latest data.
print("Creating glotec database...")
run_command(["python", "glotec.py", "-laglotec"])
print("Database created.")

# Step 2: Start Datasette as a background process.
print("Starting Datasette...")
datasette_cmd = [
    "python", "-m", "datasette", "glotec.db",
    "--plugins-dir=plugins",
    "--template-dir", "plugins/templates",
    "--root",
    "--setting", "sql_time_limit_ms", "1700000",
    "--setting", "max_returned_rows", "100000",
    "--cors",
    "--crossdb",
    "-p", "8001"
]
# Start Datasette (non-blocking).
datasette_proc = subprocess.Popen(datasette_cmd)
# Wait a few seconds for Datasette to start.
time.sleep(5)

# Step 3: Pull the first CZML data (fof2.czml).
url_fof2 = (
    "http://127.0.0.1:8001/glotec.iczml?sql=select%0D%0A++uid+as+Spotter%2C%0D%0A++timestamp%2C%0D%0A++longitude+as+tx_lng%2C%0D%0A++latitude+as+tx_lat%2C%0D%0A++%28sqrt%28NmF2+%2F.0124%29%29+%2F+1000+as+fof2%2C%0D%0A++%28sqrt%28NmF2+%2F.0124%29%29+%2F+1000+as+dB%2C%0D%0A++hmF2+*+1000+as+elev_tx%2C%0D%0A++%28sqrt%28NmF2+%2F.0124%29%29+%2F+1000+as+edmaxalt%2C%0D%0A++0+as+hmF2Map%2C%0D%0A++NmF2%0D%0Afrom%0D%0A++glotec%0D%0Awhere%0D%0A++%22tx_lat%22+%3E+-90%0D%0A++and+%22tx_lat%22+%3C+90%0D%0A++and+%22tx_lng%22+%3E+-180%0D%0A++and+%22tx_lng%22+%3C+180%0D%0A++and+NmF2+%3E+0%0D%0A++and+%22timestamp%22+%3D+%28select+max%28%22timestamp%22%29+from+glotec%29%0D%0Aorder+by%0D%0A++fof2+asc"
)
print("Fetching fof2.czml data from Datasette server...")
resp_fof2 = requests.get(url_fof2)
if resp_fof2.status_code != 200:
    print("Error fetching fof2.czml:", resp_fof2.status_code)
    sys.exit(1)
with open("fof2.czml", "w", encoding="utf-8") as f:
    f.write(resp_fof2.text)
print("fof2.czml updated.")

# Step 4: Pull the second CZML data (hmf2.iczml).
url_hmf2 = (
    "http://127.0.0.1:8001/glotec.iczml?sql=select%0D%0A++uid+as+Spotter%2C%0D%0A++timestamp%2C%0D%0A++longitude+as+tx_lng%2C%0D%0A++latitude+as+tx_lat%2C%0D%0A++hmF2+as+dB%2C%0D%0A++hmF2+*+1000+as+elev_tx%2C%0D%0A++hmF2+as+edmaxalt%2C%0D%0A++NmF2%2C%0D%0A++1+as+hmF2Map%0D%0Afrom%0D%0A++glotec%0D%0Awhere%0D%0A++%22tx_lat%22+%3E+-89%0D%0A++and+%22tx_lat%22+%3C+89%0D%0A++and+%22tx_lng%22+%3E+-180%0D%0A++and+%22tx_lng%22+%3C+180%0D%0A++and+%22timestamp%22+%3D+%28select+max%28%22timestamp%22%29+from+glotec%29%0D%0A+and+%22hmF2%22+%3E+0%0D%0A++order+by+dB+asc"
)
print("Fetching hmf2.iczml data from Datasette server...")
resp_hmf2 = requests.get(url_hmf2)
if resp_hmf2.status_code != 200:
    print("Error fetching hmf2.iczml:", resp_hmf2.status_code)
    sys.exit(1)
with open("hmf2.iczml", "w", encoding="utf-8") as f:
    f.write(resp_hmf2.text)
print("hmf2.iczml updated.")

# Step 5: Pull the third CZML data (mufd.czml).
url_mufd = (
    "http://127.0.0.1:8001/glotec.iczml?sql=SELECT+%0D%0Atimestamp%2C%0D%0Aglotec.longitude+as+tx_lng%2C%0D%0Aglotec.latitude+as+tx_lat%2C%0D%0Aglotec.longitude%2C%0D%0Aglotec.latitude%2C%0D%0A2+as+hmF2Map%2C%0D%0Asqrt%28NmF2%2F.0124%29%2F1000.0+as+fof2%2C%0D%0A%28sqrt%28NmF2%2F.0124%29%2F1000.0%29+*+%281.0%2F%28cos%28atan%28+%28sin%280.4709576138%2F2.0%29%29+%2F+%28%281.0+%2B+%28glotec.hmF2%2F6370.0%29+-cos%280.4709576138%2F2.0%29+%29%29%29%29%29%29+as+dB%2C%0D%0Auid+as+Spotter%2C%0D%0A%28sqrt%28NmF2%2F.0124%29%2F1000.0%29+*+%281.0%2F%28cos%28atan%28+%28sin%280.4709576138%2F2.0%29%29+%2F+%28%281.0+%2B+%28glotec.hmF2%2F6370.0%29+-cos%280.4709576138%2F2.0%29+%29%29%29%29%29%29++as+edmaxalt%2C%0D%0Aglotec.hmF2%0D%0AFROM+glotec+%0D%0Awhere%0D%0Aglotec.timestamp+%3D+%28SELECT+MAX%28timestamp%29+FROM+glotec%29%0D%0Aorder+by+dB+asc"
)
print("Fetching mufd.czml data from Datasette server...")
resp_mufd = requests.get(url_mufd)
if resp_mufd.status_code != 200:
    print("Error fetching mufd.czml:", resp_mufd.status_code)
    sys.exit(1)
with open("mufd.czml", "w", encoding="utf-8") as f:
    f.write(resp_mufd.text)
print("mufd.czml updated.")

# Step 6: Git commit and push the updated CZML files.
# (Git commands would be placed here.)

# Step 7: Stop the Datasette instance.
print("Stopping Datasette...")
datasette_proc.terminate()
datasette_proc.wait()

# Step 8: Delete glotec.db.
print("Deleting glotec.db...")
try:
    os.remove("glotec.db")
    print("glotec.db deleted.")
except Exception as e:
    print(f"Error deleting glotec.db: {e}")

print("Workflow complete.")
