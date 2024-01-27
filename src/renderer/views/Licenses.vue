<template>
    <Header title="Licenses" />

    <hy-main class="licenses" maxWidth="1200px">
        <hy-section>
            <p>
                {{ openSourceLicenses }}
            </p>
        </hy-section>

        <hy-section>
            <p>
                {{ fontLicenses }}
            </p>
        </hy-section>
    </hy-main>
</template>

<script>
import Header from "../components/Header.vue";

import axios from "axios";

export default {
    name: "Licenses",
    data() {
        return {
            openSourceLicenses: "",
            fontLicenses: "",
        };
    },
    async created() {
        this.openSourceLicenses = (await axios.get("open-source-licenses.txt")).data;
        this.fontLicenses += (await axios.get("fonts/source-code-pro/license.txt")).data;
    },
    components: {
        Header,
    },
};
</script>

<style lang="scss" scoped>
.licenses {
    margin-top: 120px;

    p {
        white-space: pre-wrap;
    }
}
</style>
