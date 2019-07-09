diff $1 $2
if [ $? -ne 0 ]; then
    echo "ERROR: Freshly generated output does not match expected output.  If you're confident that the expected output should be updated, copy it in there and commit it."
    exit 1
fi
