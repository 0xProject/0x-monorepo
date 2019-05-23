# This file provided not so much to be run but rather more for posterity, as a
# record of how this generated code was produced.

GENERATOR_JAR=http://central.maven.org/maven2/org/openapitools/openapi-generator-cli/3.3.4/openapi-generator-cli-3.3.4.jar
GENERATOR_JAR_BASENAME=$(basename $GENERATOR_JAR)

if [ -f $GENERATOR_JAR_BASENAME ]; then
    if [ "$(openssl dgst -sha256 $GENERATOR_JAR_BASENAME)" \
        != "SHA256($GENERATOR_JAR_BASENAME)= 24cb04939110cffcdd7062d2f50c6f61159dc3e0ca3b8aecbae6ade53ad3dc8c" \
    ]; then
        rm $GENERATOR_JAR_BASENAME
    fi
fi

if [ ! -f $GENERATOR_JAR_BASENAME ]; then
    wget $GENERATOR_JAR
fi

PYTHON_POST_PROCESS_FILE="black --line-length 79" \
    java -jar openapi-generator-cli-3.3.4.jar \
        generate \
        --input-spec http://unpkg.com/@0x/sra-spec@1.0.11/lib/api.json \
        --output . \
        --generator-name python \
        --config openapi-generator-cli-config.json \
        --enable-post-process-file
