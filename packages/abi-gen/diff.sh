diff $1 $2
if [ $? -ne 0 ]; then
    echo "ERROR: Freshly generated code does not match known-good, commited output.  If you're confident that the freshly generated code should be considered known-good, then copy it into there and commit it."
    exit 1
fi
