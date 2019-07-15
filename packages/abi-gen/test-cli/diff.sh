diff -r -U 5 $1 $2
# -r tells diff to compare folders recursively.
# "-U 5" tells diff to output a "unified" format, with 5 lines of context.
if [ $? -ne 0 ]; then
    echo "ERROR: Freshly generated output does not match expected output.  If you're confident that the expected output should be updated, copy it in there and commit it."
    exit 1
fi
