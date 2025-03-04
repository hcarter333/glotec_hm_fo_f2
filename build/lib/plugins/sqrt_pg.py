from datasette import hookimpl
import math

@hookimpl
def prepare_connection(conn):
    conn.create_function("sqrt", 1, math.sqrt)
    conn.create_function("sin", 1, math.sin)
    conn.create_function("atan", 1, math.atan)
    conn.create_function("cos", 1, math.cos)
