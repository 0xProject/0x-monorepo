diff $1 $2
if [ $? -ne 0 ]; then
    echo "ERROR: Run 'yarn generate_contract_wrappers' to update ./test/generated_test/generated-wrappers"
    exit 1
fi
