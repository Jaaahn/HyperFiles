<template>
    <Header title="Licences" />

    <hy-main class="licences" maxWidth="1200px">
        <hy-section>
            <p>
                {{ licences }}
            </p>
        </hy-section>
    </hy-main>
</template>

<script>
import Header from "../components/Header.vue";

import axios from "axios";

export default {
    name: "Licences",
    data() {
        return {
            licences: "",
        };
    },
    async created() {
        this.licences = (await axios.get("open-source-licences.txt")).data;
    },
    components: {
        Header,
    },
};
</script>

<style lang="scss" scoped>
.licences {
    margin-top: 120px;

    p {
        white-space: pre-wrap;
    }
}
</style>
